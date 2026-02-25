from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_socketio import SocketIO
from flask_wtf.csrf import CSRFProtect
from config import Config
from models import db, User, Product, Order, OrderItem
from forms import LoginForm, RegistrationForm, ProductForm
import os

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
csrf = CSRFProtect(app)
login = LoginManager(app)
login.login_view = 'login'
socketio = SocketIO(app)

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

# Routes
@app.route('/')
def index():
    featured_products = Product.query.limit(4).all()
    return render_template('home.html', products=featured_products)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        return redirect(url_for('index'))
    return render_template('login.html', title='Sign In', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data, role=form.role.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now a registered user!')
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/menu')
def menu():
    category = request.args.get('category')
    search = request.args.get('search')
    query = Product.query
    if category:
        query = query.filter_by(category=category)
    if search:
        query = query.filter(Product.name.contains(search))
    products = query.all()
    categories = db.session.query(Product.category).distinct().all()
    return render_template('menu.html', products=products, categories=[c[0] for c in categories])

@app.route('/billing')
@login_required
def billing():
    return render_template('billing.html')

@app.route('/place_order', methods=['POST'])
@login_required
def place_order():
    data = request.get_json()
    cart_items = data.get('items', [])
    if not cart_items:
        return jsonify({'error': 'Empty cart'}), 400
    
    total_amount = 0
    total_profit = 0
    
    # Create the order first
    new_order = Order(user_id=current_user.id, total_amount=0, total_profit=0)
    db.session.add(new_order)
    db.session.flush() # Get the order ID before items
    
    for item in cart_items:
        product = Product.query.get(item['id'])
        if product and product.stock >= item['qty']:
            quantity = item['qty']
            price = product.selling_price
            profit = (product.selling_price - product.cost_price) * quantity
            
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                quantity=quantity,
                price=price
            )
            db.session.add(order_item)
            
            total_amount += price * quantity
            total_profit += profit
            product.stock -= quantity
        else:
            db.session.rollback()
            return jsonify({'error': f'Stock low for {product.name if product else "item"}'}), 400
            
    new_order.total_amount = total_amount * 1.05 # Adding 5% GST
    new_order.total_profit = total_profit
    
    # Update user streak
    current_user.streak_count += 1
    
    db.session.commit()
    
    # Emit socket event for admin dashboard
    socketio.emit('new_order', {
        'id': new_order.id,
        'amount': new_order.total_amount,
        'timestamp': new_order.timestamp.strftime('%H:%M:%S')
    })
    
    return jsonify({'success': True, 'order_id': new_order.id})

@app.route('/dashboard')
@login_required
def dashboard():
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.timestamp.desc()).all()
    
    # AI Recommendation Logic (Simple implementation for college/intermediate level)
    # Frequently ordered items
    fav_items = db.session.query(Product.name, db.func.count(OrderItem.id)).\
        join(OrderItem).join(Order).\
        filter(Order.user_id == current_user.id).\
        group_by(Product.id).order_by(db.func.count(OrderItem.id).desc()).limit(3).all()
    
    # Time-based suggestions (if night suggest dessert, if morning suggest breakfast/coffee)
    from datetime import datetime
    hour = datetime.now().hour
    if 6 <= hour < 11:
        time_msg = "Start your day with these!"
        time_query = Product.query.filter(Product.category.in_(['Breakfast', 'Drink'])).limit(3).all()
    elif 11 <= hour < 17:
        time_msg = "Perfect for Lunch!"
        time_query = Product.query.filter(Product.category.in_(['Burger', 'Pizza'])).limit(3).all()
    else:
        time_msg = "Relax with these Dinner options!"
        time_query = Product.query.filter(Product.category.in_(['Dessert', 'Dinner'])).limit(3).all()
    
    return render_template('dashboard.html', 
                          orders=orders, 
                          fav_items=fav_items,
                          time_msg=time_msg,
                          time_suggestions=time_query)
@app.route('/admin')
@login_required
def admin():
    if current_user.role != 'admin':
        flash('Access denied.')
        return redirect(url_for('index'))
    products = Product.query.all()
    orders = Order.query.order_by(Order.timestamp.desc()).all()
    form = ProductForm()
    return render_template('admin.html', products=products, orders=orders, form=form)

@app.route('/admin/add_product', methods=['POST'])
@login_required
def add_product():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    form = ProductForm()
    if form.validate_on_submit():
        product = Product(
            name=form.name.data,
            category=form.category.data,
            selling_price=form.selling_price.data,
            cost_price=form.cost_price.data,
            stock=form.stock.data,
            image_url=form.image_url.data or 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
        )
        db.session.add(product)
        db.session.commit()
        flash('Product added successfully!')
    return redirect(url_for('admin'))

@app.route('/admin/delete_product/<int:id>', methods=['POST'])
@login_required
def delete_product(id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()
    flash('Product deleted.')
    return redirect(url_for('admin'))

@app.route('/seed_db')
def seed_db():
    db.drop_all()
    db.create_all()
    
    # Create Admin
    admin = User(username='admin', email='admin@example.com', role='admin')
    admin.set_password('admin123')
    db.session.add(admin)
    
    # Sample Products
    products = [
        Product(name='Gourmet Burger', category='Burger', selling_price=12.99, cost_price=5.00, stock=50, rating=4.8, image_url='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'),
        Product(name='Margherita Pizza', category='Pizza', selling_price=15.50, cost_price=6.00, stock=30, rating=4.7, image_url='https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500'),
        Product(name='Iced Coffee', category='Drink', selling_price=4.50, cost_price=1.20, stock=100, rating=4.5, image_url='https://images.unsplash.com/photo-1517701604599-bb28b5a50dd2?w=500'),
        Product(name='Chocolate Lava Cake', category='Dessert', selling_price=7.99, cost_price=3.00, stock=20, rating=4.9, image_url='https://images.unsplash.com/photo-1624353335562-3069c9725f75?w=500'),
        Product(name='Caesar Salad', category='Salad', selling_price=9.50, cost_price=3.50, stock=40, rating=4.4, image_url='https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500')
    ]
    
    for p in products:
        db.session.add(p)
    
    db.session.commit()
    return "Database seeded successfully! <a href='/'>Go Home</a>"

# Database initialization
with app.app_context():
    db.create_all()
    if not User.query.first():
        # Auto seed if empty
        try:
            admin = User(username='admin', email='admin@example.com', role='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
        except:
            pass

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001)

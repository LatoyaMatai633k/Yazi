from app import create_app, mgr

app = create_app()

with app.app_context():
    my_key = mgr.create("MY_FIRST_KEY")
    print(my_key.secret)
from flask import jsonify
from flask_api_key import api_key_required

@app.route('/api/v1/secure')
@api_key_required
def my_endpoint():
    return jsonify({'foo': 'bar'})

my_endpoint()
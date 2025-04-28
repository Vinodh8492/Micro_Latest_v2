# routes/scale_routes.py
from flask import Blueprint, jsonify, request
from models.scale import ScaleClient
from models.recipe import RecipeMaterial
from app import db

scale_bp = Blueprint('scale', __name__)
scale_client = ScaleClient()

@scale_bp.route('/values', methods=['GET'])
def get_scale_values():
    """Get current scale values"""
    values = scale_client.get_scale_values()
    if values:
        return jsonify({
            'success': True,
            'data': values
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Failed to read scale values'
        }), 500

@scale_bp.route('/net-weight', methods=['GET'])
def get_net_weight():
    """Get current net weight from scale"""
    net_weight = scale_client.get_net_weight()
    if net_weight is not None:
        return jsonify({
            'success': True,
            'net_weight': net_weight
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Failed to read net weight from scale'
        }), 500

@scale_bp.route('/capture/<int:recipe_material_id>', methods=['POST'])
def capture_weight(recipe_material_id):
    """Capture current net weight and update recipe material"""
    try:
        # Get the recipe material
        recipe_material = RecipeMaterial.query.get(recipe_material_id)
        if not recipe_material:
            return jsonify({
                'success': False,
                'message': f'Recipe material with ID {recipe_material_id} not found'
            }), 404
            
        # Get weight from scale
        net_weight = scale_client.get_net_weight()
        if net_weight is None:
            return jsonify({
                'success': False,
                'message': 'Failed to read weight from scale'
            }), 500
            
        # Update the recipe material actual value
        recipe_material.actual = net_weight
        db.session.commit()
        
        return jsonify({
            'success': True,
            'recipe_material_id': recipe_material_id,
            'actual_weight': net_weight
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@scale_bp.route('/start-dosing/<int:recipe_material_id>', methods=['POST'])
def start_dosing(recipe_material_id):
    """Start dosing process for recipe material"""
    try:
        # Get the recipe material
        recipe_material = RecipeMaterial.query.get(recipe_material_id)
        if not recipe_material:
            return jsonify({
                'success': False,
                'message': f'Recipe material with ID {recipe_material_id} not found'
            }), 404
            
        # Update status to in progress
        recipe_material.status = "in progress"
        db.session.commit()
        
        # In a real application, you might start a background process here
        # For now, we'll just update with the current weight
        net_weight = scale_client.get_net_weight()
        if net_weight is None:
            recipe_material.status = "pending"  # Revert status
            db.session.commit()
            return jsonify({
                'success': False,
                'message': 'Failed to read weight from scale'
            }), 500
            
        # Update actual weight
        recipe_material.actual = net_weight
        
        # Check if we're within tolerance of set_point
        set_point = float(recipe_material.set_point) if recipe_material.set_point else 0
        margin = float(recipe_material.margin) if recipe_material.margin else 0.1
        
        if abs(net_weight - set_point) <= margin:
            recipe_material.status = "created"
        else:
            recipe_material.status = "pending"  # Or appropriate status
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'recipe_material_id': recipe_material_id,
            'actual_weight': net_weight,
            'target_weight': set_point,
            'status': recipe_material.status
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

# Add to routes/scale_routes.py


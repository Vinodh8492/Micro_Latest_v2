from extensions import db, ma  # ✅ Import from extensions
from models.storage import StorageBucket


class Recipe(db.Model):
    __tablename__ = 'recipe'
    __table_args__ = {'extend_existing': True}  # Prevent redefinition of the table


    recipe_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    version = db.Column(db.String(20), nullable=False)

    # ✅ Updated status field
    status = db.Column(
        db.Enum("Released", "Unreleased", name="recipe_status_enum"),
        nullable=False,
        default="Unreleased",
        server_default="Unreleased"
    )

    created_by = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # ✅ Barcode field
    barcode_id = db.Column(db.String(100), unique=True, nullable=True)
    no_of_materials = db.Column(db.Integer, nullable=True)
    sequence = db.Column(db.Integer, nullable=True)

    materials = db.relationship(
        "RecipeMaterial",  # The model that this relationship refers to
        backref="recipe",  # This allows access to `recipe` from the `RecipeMaterial` model
        cascade="all, delete-orphan",  # Ensures that related RecipeMaterial rows are deleted
        passive_deletes=True  # Ensures that the delete happens in a way that can be handled by the database
    )


class RecipeMaterial(db.Model):
    __tablename__ = 'recipe_material'
    __table_args__ = {'extend_existing': True}

    recipe_material_id = db.Column(db.Integer, primary_key=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey("recipe.recipe_id", ondelete="CASCADE"), nullable=True)

    material_id = db.Column(db.Integer, db.ForeignKey("material.material_id"), nullable=False)
    set_point = db.Column(db.Numeric(10, 2), nullable=True)
    actual = db.Column(db.Numeric(10, 2), nullable=True)

    bucket_id = db.Column(db.Integer, db.ForeignKey("storage_bucket.bucket_id"), nullable=True)  # Foreign Key

    status = db.Column(
        db.Enum("pending", "in progress", "created", "Released", "Unreleased", name="recipe_material_status"),
        nullable=False,
        default="pending",
        server_default="pending"
    )

    margin = db.Column(db.Numeric(5, 2), nullable=True)

    # Define the relationship after both models are defined
    bucket = db.relationship("StorageBucket", backref="recipe_materials")

    

class RecipeSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Recipe
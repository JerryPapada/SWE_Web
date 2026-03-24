from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_roles'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='users_user' AND column_name='roles'
                ) THEN
                    ALTER TABLE users_user ADD COLUMN roles jsonb DEFAULT '[]'::jsonb NOT NULL;
                END IF;
            END $$;
            """,
            reverse_sql="ALTER TABLE users_user DROP COLUMN IF EXISTS roles;"
        )
    ]

from django.db import migrations, models


def populate_roles(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.all():
        role = getattr(user, 'role', None)
        roles = list(getattr(user, 'roles', []) or [])
        if role and role not in roles:
            roles.append(role)
            user.roles = roles
            user.save(update_fields=['roles'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='roles',
            field=models.JSONField(blank=True, default=list, help_text='List of roles for this user. Primary role is stored in `role`.', verbose_name='roles'),
        ),
        migrations.RunPython(populate_roles, migrations.RunPython.noop),
    ]

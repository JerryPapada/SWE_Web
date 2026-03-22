from django.db import migrations, models
import django.utils.translation


class Migration(migrations.Migration):

    dependencies = [
        ('venues', '0004_showtime_seats'),
    ]

    operations = [
        migrations.AlterField(
            model_name='movie',
            name='genre',
            field=models.CharField(
                max_length=100,
                choices=[
                    ('ACTION', django.utils.translation.gettext_lazy('Action')),
                    ('COMEDY', django.utils.translation.gettext_lazy('Comedy')),
                    ('DRAMA', django.utils.translation.gettext_lazy('Drama')),
                    ('THRILLER', django.utils.translation.gettext_lazy('Thriller')),
                    ('HORROR', django.utils.translation.gettext_lazy('Horror')),
                    ('ROMANCE', django.utils.translation.gettext_lazy('Romance')),
                    ('SCI_FI', django.utils.translation.gettext_lazy('Sci-Fi')),
                    ('FANTASY', django.utils.translation.gettext_lazy('Fantasy')),
                    ('ANIMATION', django.utils.translation.gettext_lazy('Animation')),
                    ('DOCUMENTARY', django.utils.translation.gettext_lazy('Documentary')),
                ],
                verbose_name='genre',
            ),
        ),
    ]

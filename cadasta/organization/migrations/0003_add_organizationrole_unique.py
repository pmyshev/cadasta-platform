# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-10-26 08:49
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('organization', '0002_unique_org_project_names'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='organizationrole',
            unique_together=set([('organization', 'user')]),
        ),
    ]

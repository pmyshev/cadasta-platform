import os.path
import factory
from faker import Faker, Factory
from datetime import datetime, timezone

from accounts.models import User
from organization.models import Organization, Project
from tutelary.models import Policy, Role, PolicyInstance, RolePolicyAssign

from accounts.tests.factories import UserFactory
from organization.tests.factories import OrganizationFactory, ProjectFactory


class PolicyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Policy

    @classmethod
    def set_directory(cls, dir):
        cls.directory = dir

    @classmethod
    def _adjust_kwargs(cls, **kwargs):
        body_file = os.path.join(cls.directory, kwargs.pop('file', None))
        kwargs['body'] = open(body_file).read()
        return kwargs


class RoleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Role


class FixturesData():
    def add_test_users(self):
        users = []
        # the first two named users will have superuser access
        named_users = [
            {'username': 'iross', 'email': 'iross@cadasta.org',
             'first_name': 'Ian', 'last_name': 'Ross'},
            {'username': 'oroick', 'email': 'oroick@cadasta.org',
             'first_name': 'Oliver', 'last_name': 'Roick'}]
        # add user's with names in languages that need to be tested.
        languages = ['el_GR', 'ja_JP', 'hi_IN', 'hr_HR', 'lt_LT']
        lang_users = [{
            'first_name': 'עזרא',
            'last_name': 'ברש'
        }]
        for lang in languages:
            fake = Factory.create(lang)
            lang_users.append({
                'username': 'testuser{}'.format(lang),
                'email': '{}user@example.com'.format(lang),
                'first_name': fake.first_name(),
                'last_name': fake.last_name()
            })
        for n in range(20):
            if n < len(named_users):
                users.append(UserFactory.create(
                    **named_users[n],
                    password='password',
                    email_verified=True,
                    last_login=datetime.now(tz=timezone.utc),
                    is_active=True,
                ))
            elif n < len(named_users) + len(lang_users):
                users.append(UserFactory.create(
                    password='password',
                    email_verified=True,
                    is_active=(n < 8),
                    first_name=factory.Faker('first_name'),
                    last_name=factory.Faker('last_name'),
                ))
        self.stdout.write(self.style.SUCCESS('Successfully added test users.'))
        return users

    def add_test_users_and_roles(self):
        users = FixturesData.add_test_users(self)

        PolicyFactory.set_directory('config/permissions')

        pols = {}
        for pol in ['default', 'superuser', 'org-admin', 'project-manager',
                    'data-collector', 'project-user']:
            pols[pol] = PolicyFactory.create(name=pol, file=pol + '.json')

        roles = {}
        roles['superuser'] = RoleFactory.create(
            name='superuser',
            policies=[pols['default'], pols['superuser']]
        )
        for org in ['habitat-for-humanity', 'cadasta']:
            for abbrev, pol in [('oa', 'org-admin')]:
                roles[org + '-' + abbrev] = RoleFactory.create(
                    name=org + '-' + abbrev,
                    policies=[pols['default'], pols[pol]],
                    variables={'organization': org})

        users[0].assign_policies(roles['superuser'])
        users[1].assign_policies(roles['superuser'])
        users[2].assign_policies(roles['cadasta-oa'])
        users[3].assign_policies(roles['habitat-for-humanity-oa'])
        users[4].assign_policies(roles['habitat-for-humanity-oa'],
                                 roles['cadasta-oa'])

        self.stdout.write(self.style.SUCCESS(
            "\n{} and {} have superuser policies."
            .format(users[0], users[1])))

        self.stdout.write(self.style.SUCCESS(
            "\n{} and {} have cadasta-oa policies."
            .format(users[2], users[4])))

        self.stdout.write(self.style.SUCCESS(
            "\n{} and {} have habitat-for-humanity-oa policies."
            .format(users[3], users[4])))

    def add_test_organizations(self):
        orgs = []
        users = User.objects.filter(username__startswith='testuser')

        for n in range(3):
            orgs.append(OrganizationFactory.create(
                add_users=users
            ))

        self.stdout.write(self.style.SUCCESS(
            '\nSuccessfully added organizations {}'
            .format(Organization.objects.all())))

    def add_test_projects(self):
        projs = []
        if Organization.objects.all().exists():
            orgs = Organization.objects.all()
        else:
            orgs = OrganizationFactory.create_batch(2)
        projs.append(ProjectFactory.create(
            name='Kibera',
            project_slug='kibera',
            description="""This is a test project.  This is a test project.
            This is a test project.  This is a test project.  This is a test
            project.  This is a test project.  This is a test project.  This
            is a test project.  This is a test project.""",
            organization=orgs[0],
            country='KE'
        ))
        projs.append(ProjectFactory.create(
            name='H4H Test Project',
            project_slug='h4h-test-project',
            description="""This is a test project.  This is a test project.
            This is a test project.  This is a test project.  This is a test
            project.  This is a test project.  This is a test project.  This
            is a test project.  This is a test project.""",
            organization=orgs[0],
            country='PH'
        ))
        projs.append(ProjectFactory.create(
            name='Cadasta Indonesia Test Project',
            project_slug='cadasta-indonesia-test-project',
            description="""This is another test project.  This is another test
            project. This is another test project.  This is another test
            project. This is another test project.  This is a test project.
            This is another test project.  This is another test project.
            This is another test project.""",
            organization=orgs[1],
            country='ID'
        ))
        projs.append(ProjectFactory.create(
            name='Cadasta Myanmar Test Project',
            project_slug='cadasta-myanmar-test-project',
            description=""""This is another test project.  This is another test
            project. This is another test project.  This is another test
            project. This is another test project.  This is a test project.
            This is another test project.  This is another test project.
            This is another test project.""",
            organization=orgs[1],
            country='MM'
        ))

    def delete_test_organizations(self):
        orgs = Organization.objects.filter(name__startswith='Organization #')
        for org in orgs:
            org.delete()

        PolicyInstance.objects.all().delete()
        RolePolicyAssign.objects.all().delete()
        Policy.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(
            """Successfully deleted all test organizations.
            Remaining organizations: {}"""
            .format(Organization.objects.all())))

    def delete_test_users(self):
        users = User.objects.filter(username__startswith='testuser')
        for user in users:
            user.delete()
        # Specified named users.
        named_users = ['iross', 'oroick']
        for user in named_users:
            if User.objects.filter(username=user).exists():
                User.objects.get(username=user).delete()

        self.stdout.write(self.style.SUCCESS(
            'Successfully deleted test users. Remaining users: {}'
            .format(User.objects.all())))

    def delete_test_projects(self):
        projs = Project.objects.filter(name__contains='Test Project')
        projs.delete()

        self.stdout.write(self.style.SUCCESS(
            'Successfully deleted test projects. Remaining users: {}'
            .format(User.objects.all())))

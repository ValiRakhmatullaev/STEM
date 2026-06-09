from django.apps import AppConfig


class ContentConfig(AppConfig):
  name = "apps.content"
  verbose_name = "Site content"

  def ready(self):
    import apps.content.signals  # noqa: F401

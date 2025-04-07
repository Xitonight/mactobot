interface Resources {
  "ns1": {
    "welcome": {
      "settings": "**⚙️ Welcome settings**\n\n- Welcoming new members: `{{enable}}`\n- Deleting telegram welcome messages: `{{deleteDefault}}`",
      "default": "Hi, {user_full}! Welcome to {chat_name}!",
      "usage": {
        "default": "- Use `/welcome` to see the current settings for the welcome module.\n- Use `/welcome <on|off>` to enable or disable the welcome message.",
        "set": "- Use `/welcome set` to change the current welcome message.\n- Use `/welcome set default` to set the default welcome message.",
        "show": "- Use `/welcome show` to show the current welcome message.",
        "delete_default": "- Use `/welcome delete default <on|off>` to enable or disable automatic deletion for default welcome messages (`user joined the group`)."
      },
      "buttons": {
        "enable": "Enable welcome message",
        "disable": "Disable welcome message",
        "delete_default": "Delete telegram welcome messages",
        "dont_delete_default": "Don't delete telegram welcome messages"
      },
      "message_header": "**🗨️ Welcome message**",
      "enabled": "**Successfully enabled welcome message.**",
      "disabled": "**Successfully disabled welcome message.**",
      "enter_new": "**Please reply with the new welcome message.**",
      "reset": "**Successfully reset welcome message to default one.**",
      "set": "**Welcome message set successfully.**",
      "enable_delete_default": "**Successfully enabled default welcome message deletion.**",
      "disable_delete_default": "**Successfully disabled default welcome message deletion.**"
    },
    "goodbye": {
      "settings": "**⚙️ Goodbye settings**\n\n- Bidding farewell to leaving members: `{{enable}}`\n- Deleting telegram goodbye messages: `{{deleteDefault}}`",
      "default": "Farewell, {user_full}... We hope to see you again!",
      "usage": {
        "default": "- Use `/goodbye` to see the current settings for the goodbye module.\n- Use `/goodbye <on|off>` to enable or disable the goodbye message.",
        "set": "- Use `/goodbye set` to change the current goodbye message.\n- Use `/goodbye set default` to set the default goodbye message.",
        "show": "- Use `/goodbye show` to show the current goodbye message.",
        "delete_default": "- Use `/goodbye delete default <on|off>` to enable or disable automatic deletion for default goodbye messages (`user left the group`)."
      },
      "message_header": "**🗨️ Goodbye message**",
      "enabled": "**Successfully enabled goodbye message.**",
      "disabled": "**Successfully disabled goodbye message.**",
      "enter_new": "**Please reply with the new goodbye message.**",
      "reset": "**Successfully reset goodbye message to default one.**",
      "set": "**Goodbye message set successfully.**",
      "enable_delete_default": "**Successfully enabled default goodbye message deletion.**",
      "disable_delete_default": "**Successfully disabled default goodbye message deletion.**"
    },
    "language": {
      "settings": "**Current language:** `{{lang}}`",
      "usage": "- Use `/language` to see the current language and the supported ones.\n- Use `/language <language>` to change the current language.",
      "supported": "**Supported languages:\n- 🇬🇧 `en`\n- 🇮🇹 `it`**",
      "set": "**Language updated successfully.**"
    },
    "settings": {
      "where_to_open": "**Where do you want to open settings?**",
      "buttons": {
        "open_here": "Open here",
        "open_pm": "Open in PM"
      },
      "home_page": "**Settings for {{chat}}**"
    },
    "errors": {
      "common": {
        "too_many_args": "**Error: too many arguments.**",
        "missing_args": "**Error: missing argument(s).**",
        "unknown_args": "**Error: unknown argument(s).**",
        "deleting_service_message": "**Error deleting service message.**",
        "deleting_message": "**Error deleting message.**",
        "custom": "**Error:**\n{{err}}"
      },
      "language": {
        "unsupported_lang": "**Error: unsupported language**"
      },
      "welcome": {
        "resetting_welcome_message": "**Error resetting welcome message.**",
        "setting_welcome_message": "**Error setting welcome message.**",
        "enabling_welcome_message": "**Error enabling welcome message.**",
        "disabling_welcome_message": "**Error disabling welcome message.**",
        "showing_welcome_message": "**Error showing welcome message.**",
        "enabling_delete_default": "**Error enabling default welcome message deletion",
        "disabling_delete_default": "**Error disabling default welcome message deletion"
      },
      "goodbye": {
        "resetting_goodbye_message": "**Error resetting goodbye message.**",
        "setting_goodbye_message": "**Error setting goodbye message.**",
        "enabling_goodbye_message": "**Error enabling goodbye message.**",
        "disabling_goodbye_message": "**Error disabling goodbye message.**",
        "showing_goodbye_message": "**Error showing goodbye message.**",
        "enabling_delete_default": "**Error enabling default goodbye message deletion",
        "disabling_delete_default": "**Error disabling default goodbye message deletion"
      }
    }
  }
}

export default Resources;

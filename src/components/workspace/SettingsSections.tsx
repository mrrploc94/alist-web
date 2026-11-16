import { JSX } from "solid-js"
import { SettingItem } from "~/types"

export const FormSection = (props: {
  title: string
  description?: string
  children: JSX.Element
}) => (
  <section class="atp-form-section">
    <div class="atp-section-title">
      <h2>{props.title}</h2>
      {props.description && <p>{props.description}</p>}
    </div>
    <div class="atp-form-fields">{props.children}</div>
  </section>
)

const sections: Record<number, [string, string[]][]> = {
  1: [
    ["identity_notice", ["site_title", "announcement", "version"]],
    [
      "file_browsing",
      [
        "default_page_size",
        "pagination_type",
        "frontend_remember_sort",
        "use_newui",
      ],
    ],
    [
      "access_search",
      [
        "allow_indexed",
        "allow_mounted",
        "allow_register",
        "default_role",
        "robots_txt",
      ],
    ],
  ],
  2: [
    ["brand_identity", ["logo", "favicon", "main_color", "home_icon"]],
    ["display_layout", ["home_container", "settings_layout"]],
  ],
  3: [
    [
      "file_types_thumbnails",
      [
        "image_types",
        "video_types",
        "audio_types",
        "text_types",
        "thumbnail_size",
        "audio_cover",
      ],
    ],
    [
      "preview_behavior",
      [
        "video_autoplay",
        "audio_autoplay",
        "preview_archives_by_default",
        "readme_autorender",
        "filter_readme_scripts",
      ],
    ],
    [
      "external_proxy",
      [
        "external_previews",
        "iframe_previews",
        "preview_settings",
        "proxy_types",
        "proxy_ignore_headers",
      ],
    ],
  ],
  4: [
    [
      "devices_sessions",
      [
        "max_devices",
        "device_session_ttl",
        "device_evict_policy",
        "webauthn_login_enabled",
      ],
    ],
    [
      "paths_transfer",
      [
        "hide_files",
        "filename_char_mapping",
        "forward_direct_link_params",
        "ignore_direct_link_params",
        "link_expiration",
        "sign_all",
        "package_download",
        "max_extract_size",
      ],
    ],
    [
      "custom_services",
      [
        "customize_head",
        "customize_body",
        "meta_not_found_cache_expire",
        "ocr_api",
        "privacy_regs",
      ],
    ],
  ],
  7: [
    [
      "sso_connection",
      [
        "sso_login_enabled",
        "sso_login_platform",
        "sso_client_id",
        "sso_client_secret",
        "sso_endpoint_name",
        "sso_application_name",
        "sso_organization_name",
      ],
    ],
    [
      "registration_defaults",
      ["sso_auto_register", "sso_default_dir", "sso_default_permission"],
    ],
    [
      "oidc_compatibility",
      [
        "sso_compatibility_mode",
        "sso_extra_scopes",
        "sso_jwt_public_key",
        "sso_oidc_username_key",
      ],
    ],
  ],
  8: [
    [
      "ldap_connection",
      [
        "ldap_login_enabled",
        "ldap_server",
        "ldap_manager_dn",
        "ldap_manager_password",
      ],
    ],
    [
      "ldap_users",
      [
        "ldap_user_search_base",
        "ldap_user_search_filter",
        "ldap_default_dir",
        "ldap_default_permission",
        "ldap_login_tips",
      ],
    ],
  ],
  10: [
    [
      "address_pasv",
      ["ftp_public_host", "ftp_pasv_port_map", "ftp_proxy_user_agent"],
    ],
    [
      "tls",
      [
        "ftp_implicit_tls",
        "ftp_mandatory_tls",
        "ftp_tls_private_key_path",
        "ftp_tls_public_cert_path",
      ],
    ],
  ],
  11: [
    [
      "speed_limits",
      [
        "max_client_download_speed",
        "max_client_upload_speed",
        "max_server_download_speed",
        "max_server_upload_speed",
      ],
    ],
    [
      "task_workers",
      [
        "upload_task_threads_num",
        "copy_task_threads_num",
        "offline_download_task_threads_num",
        "offline_download_transfer_task_threads_num",
        "decompress_download_task_threads_num",
        "decompress_upload_task_threads_num",
      ],
    ],
  ],
}

export const getSettingSections = (group: number, settings: SettingItem[]) => {
  const used = new Set<string>()
  const result = (sections[group] || [])
    .map(([title, keys]) => {
      const items = settings.filter((i) => keys.includes(i.key))
      items.forEach((i) => used.add(i.key))
      return { title, items }
    })
    .filter((s) => s.items.length)
  const remaining = settings.filter((i) => !used.has(i.key))
  if (remaining.length)
    result.push({ title: "other_options", items: remaining })
  return result
}

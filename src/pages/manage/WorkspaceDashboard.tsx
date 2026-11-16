import { For, Show } from "solid-js"
import { Link } from "@solidjs/router"
import {
  FiHardDrive,
  FiUsers,
  FiShield,
  FiActivity,
  FiFolder,
  FiSearch,
  FiEye,
  FiTag,
  FiMonitor,
  FiSettings,
  FiDatabase,
  FiMessageSquare,
  FiArrowUpRight,
} from "solid-icons/fi"
import { me } from "~/store"
import { useT } from "~/hooks"
import { joinBase } from "~/utils"
const items = [
  [
    "storages",
    "manage.sidemenu.storages",
    "workspace.storage_hint",
    FiHardDrive,
  ],
  ["users", "manage.sidemenu.users", "workspace.users_hint", FiUsers],
  [
    "permissions/role",
    "workspace.roles_scopes",
    "workspace.roles_hint",
    FiShield,
  ],
  ["tasks/upload", "workspace.alist_tasks", "workspace.tasks_hint", FiActivity],
  ["metas", "manage.sidemenu.metas", "workspace.metadata_hint", FiFolder],
  ["indexes", "manage.sidemenu.indexes", "workspace.index_hint", FiSearch],
  [
    "settings/preview-settings",
    "workspace.preview_manager",
    "workspace.preview_hint",
    FiEye,
  ],
  ["settings/tag", "manage.sidemenu.tag", "workspace.tags_hint", FiTag],
  [
    "session/management",
    "manage.sidemenu.session_management",
    "workspace.sessions_hint",
    FiMonitor,
  ],
  [
    "settings/site",
    "manage.sidemenu.settings",
    "workspace.settings_hint",
    FiSettings,
  ],
  [
    "backup-restore",
    "manage.sidemenu.backup-restore",
    "workspace.config_backup_hint",
    FiDatabase,
  ],
  [
    "messenger",
    "workspace.messenger",
    "workspace.messenger_hint",
    FiMessageSquare,
  ],
] as const
export default function WorkspaceDashboard() {
  const t = useT()
  return (
    <Show
      when={me()?.role?.includes(2)}
      fallback={<p>{t("workspace.admin_required")}</p>}
    >
      <section class="atp-native-start">
        <div>
          <h2>{t("workspace.configure_storage_access")}</h2>
          <p>{t("workspace.configure_storage_hint")}</p>
        </div>
        <Link
          class="atp-button atp-primary"
          href={joinBase("/@manage/storages")}
        >
          {t("manage.sidemenu.storages")}
        </Link>
      </section>
      <div class="atp-native-hub">
        <For each={items}>
          {([path, label, hint, Icon]) => (
            <Link class="atp-hub-card" href={joinBase("/@manage/" + path)}>
              <span class="atp-hub-icon">
                <Icon />
              </span>
              <div>
                <h2>{t(label)}</h2>
                <p>{t(hint)}</p>
              </div>
              <FiArrowUpRight />
            </Link>
          )}
        </For>
      </div>
      <section class="atp-backup-entry">
        <div>
          <h2>{t("workspace.backup_tools")}</h2>
          <p>{t("workspace.backup_description")}</p>
        </div>
        <div>
          <Link class="atp-button" href={joinBase("/@manage/backup/overview")}>
            {t("workspace.backup_capacity")}
          </Link>
          <Link class="atp-button" href={joinBase("/@manage/backup/schedules")}>
            {t("workspace.backup_schedules")}
          </Link>
        </div>
      </section>
    </Show>
  )
}

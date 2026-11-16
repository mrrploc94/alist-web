import { For, Show, createMemo, JSX } from "solid-js"
import { Link } from "@solidjs/router"
import {
  FiGrid,
  FiHardDrive,
  FiUsers,
  FiShield,
  FiMonitor,
  FiActivity,
  FiLink,
  FiFolder,
  FiSearch,
  FiEye,
  FiTag,
  FiSettings,
  FiDatabase,
  FiMessageSquare,
  FiArchive,
  FiCalendar,
  FiUser,
  FiInfo,
} from "solid-icons/fi"
import { useRouter, useT } from "~/hooks"
import { me } from "~/store"
import { joinBase } from "~/utils"
import { side_menu_items, SideMenuItem } from "~/pages/manage/sidemenu_items"

type Item = {
  path: string
  label: string
  icon: (props?: any) => JSX.Element
  admin?: boolean
  general?: boolean
}
const groups: { label: string; items: Item[] }[] = [
  {
    label: "workspace.system",
    items: [
      {
        path: "/@manage/dashboard",
        label: "workspace.admin_home",
        icon: FiGrid,
        admin: true,
      },
      {
        path: "/@manage/storages",
        label: "manage.sidemenu.storages",
        icon: FiHardDrive,
        admin: true,
      },
      {
        path: "/@manage/users",
        label: "manage.sidemenu.users",
        icon: FiUsers,
        admin: true,
      },
      {
        path: "/@manage/permissions/role",
        label: "workspace.roles_scopes",
        icon: FiShield,
        admin: true,
      },
      {
        path: "/@manage/session/management",
        label: "manage.sidemenu.session_management",
        icon: FiMonitor,
        admin: true,
      },
    ],
  },
  {
    label: "workspace.content_tasks",
    items: [
      {
        path: "/@manage/tasks/upload",
        label: "workspace.alist_tasks",
        icon: FiActivity,
        general: true,
      },
      {
        path: "/@manage/shares",
        label: "manage.sidemenu.shares",
        icon: FiLink,
        general: true,
      },
      {
        path: "/@manage/metas",
        label: "manage.sidemenu.metas",
        icon: FiFolder,
        admin: true,
      },
      {
        path: "/@manage/indexes",
        label: "manage.sidemenu.indexes",
        icon: FiSearch,
        admin: true,
      },
      {
        path: "/@manage/settings/preview-settings",
        label: "workspace.preview_manager",
        icon: FiEye,
        admin: true,
      },
      {
        path: "/@manage/settings/tag",
        label: "manage.sidemenu.tag",
        icon: FiTag,
        admin: true,
      },
    ],
  },
  {
    label: "workspace.configuration_tools",
    items: [
      {
        path: "/@manage/settings/site",
        label: "manage.sidemenu.settings",
        icon: FiSettings,
        admin: true,
      },
      {
        path: "/@manage/backup-restore",
        label: "manage.sidemenu.backup-restore",
        icon: FiDatabase,
        admin: true,
      },
      {
        path: "/@manage/messenger",
        label: "workspace.messenger",
        icon: FiMessageSquare,
        admin: true,
      },
    ],
  },
  {
    label: "workspace.backup_tools",
    items: [
      {
        path: "/@manage/backup/overview",
        label: "workspace.backup_capacity",
        icon: FiHardDrive,
        admin: true,
      },
      {
        path: "/@manage/backup/users",
        label: "workspace.backup_users",
        icon: FiArchive,
        admin: true,
      },
      {
        path: "/@manage/backup/schedules",
        label: "workspace.backup_schedules",
        icon: FiCalendar,
        admin: true,
      },
    ],
  },
  {
    label: "workspace.personal",
    items: [
      { path: "/@manage", label: "workspace.my_account", icon: FiUser },
      {
        path: "/@manage/session/my_session",
        label: "manage.sidemenu.my_session",
        icon: FiMonitor,
        general: true,
      },
      { path: "/@manage/about", label: "manage.sidemenu.about", icon: FiInfo },
    ],
  },
]

export const ManageNavigation = (props: { onNavigate?: () => void }) => {
  const t = useT()
  const { pathname } = useRouter()
  const allowed = (item: Item) =>
    (!item.admin || me()?.role?.includes(2)) &&
    (!item.general || !me()?.role?.includes(1))
  const active = (path: string) => {
    if (path === "/@manage")
      return pathname() === path || pathname() === "/@manage/2fa"
    if (path.includes("/tasks/"))
      return pathname().startsWith("/@manage/tasks/")
    if (path.endsWith("settings/site"))
      return (
        pathname().startsWith("/@manage/settings/") &&
        !["preview-settings", "tag"].includes(pathname().split("/").pop() || "")
      )
    if (path.endsWith("permissions/role"))
      return pathname().startsWith("/@manage/permissions/")
    return pathname() === path || pathname().startsWith(path + "/")
  }
  return (
    <nav
      class="atp-management-nav"
      aria-label={t("workspace.management_navigation")}
    >
      <For each={groups}>
        {(group) => (
          <Show when={group.items.some(allowed)}>
            <section class="atp-nav-group">
              <h2>{t(group.label)}</h2>
              <For each={group.items.filter(allowed)}>
                {(item) => (
                  <Link
                    href={joinBase(item.path)}
                    classList={{ active: active(item.path) }}
                    aria-current={active(item.path) ? "page" : undefined}
                    onClick={props.onNavigate}
                  >
                    {item.icon({} as never)}
                    <span>{t(item.label)}</span>
                  </Link>
                )}
              </For>
            </section>
          </Show>
        )}
      </For>
    </nav>
  )
}

export const SettingsNavigation = () => {
  const t = useT()
  const { pathname } = useRouter()
  const items = createMemo(
    () =>
      side_menu_items
        .find((i) => i.to === "/@manage/settings")
        ?.children?.filter(
          (i) =>
            !i.to?.endsWith("/tag") && !i.to?.endsWith("/preview-settings"),
        ) || [],
  )
  return (
    <nav class="atp-settings-nav" aria-label={t("manage.sidemenu.settings")}>
      <For each={items()}>
        {(item) => (
          <Link
            href={joinBase(item.to!)}
            classList={{ active: pathname() === item.to }}
            aria-current={pathname() === item.to ? "page" : undefined}
          >
            {t(item.title)}
          </Link>
        )}
      </For>
    </nav>
  )
}

export const getManagePage = (path: string) => {
  if (path === "/@manage/custom-shares")
    return {
      title: "workspace.custom_shares",
      description: "workspace.shares_description",
    }
  const leaf = path.split("/").pop()
  const edit = leaf === "add" || /\/edit\//.test(path)
  const collection = path.split("/")[2]
  if (edit)
    return {
      title: `workspace.${collection}_${leaf === "add" ? "add" : "edit"}`,
      description: `workspace.${collection}_description`,
    }
  if (path === "/@manage/dashboard")
    return {
      title: "workspace.admin_home",
      description: "workspace.admin_home_description",
    }
  if (path.startsWith("/@manage/backup/"))
    return {
      title: `workspace.backup_${leaf === "overview" ? "capacity" : leaf}`,
      description: "workspace.backup_description",
    }
  let found: SideMenuItem | undefined
  const visit = (items: SideMenuItem[]) =>
    items.forEach((i) => {
      if (i.to === path) found = i
      if (i.children) visit(i.children)
    })
  visit(side_menu_items)
  return {
    title:
      found?.title ||
      (path === "/@manage/messenger"
        ? "workspace.messenger"
        : "workspace.my_account"),
    description: `workspace.${collection || "profile"}_description`,
  }
}

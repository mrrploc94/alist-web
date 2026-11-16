import { createMemo, Show, JSX } from "solid-js"
import { Link } from "@solidjs/router"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  IconButton,
} from "@hope-ui/solid"
import {
  FiFolder,
  FiSliders,
  FiLink,
  FiActivity,
  FiMenu,
  FiUser,
  FiLogOut,
  FiSettings,
} from "solid-icons/fi"
import { getSetting, me } from "~/store"
import { useRouter, useT, useFetch } from "~/hooks"
import { SwitchColorMode, SwitchLanguage } from "~/components"
import { joinBase, r, handleResp, notify } from "~/utils"
import { clearUserData } from "~/utils/auth"
import { PResp } from "~/types"

export const WorkspaceHeader = (props: {
  manage?: boolean
  onMenu?: () => void
  actions?: JSX.Element
}) => {
  const t = useT()
  const { to, pathname } = useRouter()
  const isAdmin = () => me()?.role?.includes(2)
  const username = () => me()?.username || t("workspace.account")
  const logo = createMemo(
    () => getSetting("logo").split("\n")[0] || joinBase("/images/new_icon.png"),
  )
  const [loggingOut, logout] = useFetch((): PResp<any> => r.get("/auth/logout"))
  const signOut = async () =>
    handleResp(await logout(), () => {
      clearUserData()
      notify.success(t("manage.logout_success"))
      to(`/@login?redirect=${encodeURIComponent(pathname())}`)
    })
  return (
    <header class="atp-workspace-header">
      <Show when={props.onMenu}>
        <button
          class="atp-icon-button atp-mobile-menu"
          aria-label={t("workspace.open_menu")}
          onClick={props.onMenu}
        >
          <FiMenu />
        </button>
      </Show>
      <Link
        class="atp-brand"
        href={joinBase("/")}
        aria-label={getSetting("site_title")}
      >
        <img src={logo()} alt={getSetting("site_title")} />
        <span>AList</span>
      </Link>
      <nav class="atp-workspaces" aria-label={t("workspace.navigation")}>
        <Link href={joinBase("/")} classList={{ active: !props.manage }}>
          <FiFolder />
          <span>{t("workspace.files")}</span>
        </Link>
        <Show when={isAdmin()}>
          <Link
            href={joinBase("/@manage/dashboard")}
            classList={{ active: props.manage }}
          >
            <FiSliders />
            <span>{t("workspace.management")}</span>
          </Link>
        </Show>
        <Show when={me()?.role && !me().role.includes(1)}>
          <Link class="atp-secondary-nav" href={joinBase("/@manage/shares")}>
            <FiLink />
            <span>{t("manage.sidemenu.shares")}</span>
          </Link>
          <Link
            class="atp-secondary-nav"
            href={joinBase("/@manage/tasks/upload")}
          >
            <FiActivity />
            <span>{t("manage.sidemenu.tasks")}</span>
          </Link>
        </Show>
      </nav>
      <div class="atp-header-actions">
        {props.actions}
        <SwitchLanguage
          as={IconButton}
          aria-label={t("workspace.language")}
          icon={<span aria-hidden="true">文</span>}
          size="sm"
          variant="ghost"
        />
        <SwitchColorMode />
        <Menu>
          <MenuTrigger
            class="atp-avatar"
            aria-label={t("workspace.account")}
            as="button"
          >
            {username().slice(0, 2).toUpperCase()}
          </MenuTrigger>
          <MenuContent>
            <MenuItem icon={<FiUser />} onSelect={() => to("/@manage")}>
              {username()}
            </MenuItem>
            <MenuItem icon={<FiSettings />} onSelect={() => to("/@manage")}>
              {t("workspace.profile_security")}
            </MenuItem>
            <MenuItem
              icon={<FiLogOut />}
              disabled={loggingOut()}
              onSelect={signOut}
            >
              {t("manage.logout")}
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </header>
  )
}

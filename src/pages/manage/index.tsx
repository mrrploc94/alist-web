import { createMemo, For, onCleanup, onMount, Show, Suspense } from "solid-js"
import { Route, Routes, Link } from "@solidjs/router"
import { FullLoading } from "~/components"
import { useT, useTitle, useRouter } from "~/hooks"
import { getSetting } from "~/store"
import { Header } from "./Header"
import { routes } from "./routes"
import {
  ManageNavigation,
  SettingsNavigation,
  getManagePage,
} from "~/components/workspace/ManageNavigation"
import { side_menu_items } from "./sidemenu_items"
import { joinBase } from "~/utils"
const Manage = () => {
  const t = useT(),
    { pathname } = useRouter()
  const page = createMemo(() => getManagePage(pathname()))
  const settingsPage = () =>
    pathname().startsWith("/@manage/settings/") &&
    !["preview-settings", "tag"].includes(pathname().split("/").pop() || "")
  const tasksPage = () => pathname().startsWith("/@manage/tasks/")
  let content!: HTMLDivElement
  useTitle(() => t("manage.title"))
  onMount(() => {
    const decorate = () => {
      for (const table of content.querySelectorAll("table")) {
        const headers = Array.from(table.querySelectorAll("thead th"))
        headers.forEach((h) => h.setAttribute("scope", "col"))
        for (const row of table.querySelectorAll("tbody tr"))
          Array.from(row.children).forEach((cell, i) => {
            if (headers[i])
              (cell as HTMLElement).dataset.label = headers[i].textContent || ""
          })
      }
    }
    const observer = new MutationObserver(decorate)
    observer.observe(content, { subtree: true, childList: true })
    decorate()
    onCleanup(() => observer.disconnect())
  })
  return (
    <div class="atp-app atp-management">
      <aside class="atp-management-sidebar">
        <a class="atp-brand" href={joinBase("/")}>
          <img
            src={
              getSetting("logo").split("\n")[0] ||
              joinBase("/images/new_icon.png")
            }
            alt={getSetting("site_title")}
          />
          <span>AList</span>
        </a>
        <ManageNavigation />
        <div class="atp-sidebar-footer">
          {getSetting("site_title")}
          <br />
          AList {getSetting("version")}
        </div>
      </aside>
      <div class="atp-management-main">
        <Header />
        <main class="atp-manage-content" ref={content}>
          <header class="atp-page-heading">
            <h1>{t(page().title)}</h1>
            <p>{t(page().description, undefined, "")}</p>
          </header>
          <Show when={tasksPage()}>
            <nav class="atp-task-types" aria-label={t("workspace.alist_tasks")}>
              <For
                each={
                  side_menu_items.find((i) => i.to === "/@manage/tasks")
                    ?.children || []
                }
              >
                {(item) => (
                  <Link
                    href={joinBase(item.to!)}
                    classList={{ active: pathname() === item.to }}
                  >
                    {t(item.title)}
                  </Link>
                )}
              </For>
            </nav>
          </Show>
          <div classList={{ "atp-settings-frame": settingsPage() }}>
            <Show when={settingsPage()}>
              <SettingsNavigation />
            </Show>
            <section
              class="atp-route-content"
              classList={{
                "atp-route-panel":
                  !pathname().includes("/dashboard") &&
                  !pathname().includes("/backup/"),
              }}
            >
              <Suspense fallback={<FullLoading />}>
                <Routes>
                  <For each={routes}>
                    {(route) => (
                      <Route path={route.to!} component={route.component} />
                    )}
                  </For>
                </Routes>
              </Suspense>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
export default Manage

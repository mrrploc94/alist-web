import { createSignal, For, onMount, Show } from "solid-js"
import { Link } from "@solidjs/router"
import { Paginator } from "~/components"
import { Button, Input } from "@hope-ui/solid"
import { useRouter, useT } from "~/hooks"
import { me } from "~/store"
import { joinBase } from "~/utils"

interface StorageQuota {
  id: number
  mount_path: string
  driver: string
  status: string
  total_bytes: number | null
  used_bytes: number | null
  free_bytes: number | null
  quota_group?: string
}
interface BackupUser {
  username: string
  server: string
  source_bytes: number | null
  backup_bytes: number | null
  last_backup: string | number | null
  method?: string
  backup_count: number
}
interface Schedule {
  id: string
  name: string
  destination: string
  cron: string
  next_run: number | null
  enabled: boolean
  created_at: number | null
  retention?: string
  source_timezone?: string
  method?: string
  scope?: string
}
interface History {
  user: string
  server: string
  method: string
  status: string
  started: number | null
  ended: number | null
  duration: number | null
  created?: number
  error?: string
}
interface DashboardData {
  updated_at: number
  storages: StorageQuota[]
  users: BackupUser[]
  schedules: Schedule[]
  history: History[]
  totals: {
    total_bytes: number | null
    used_bytes: number | null
    unknown_storages: number
    active_jobs: number
  }
  warnings?: string[]
  sources?: { host: string; updated_at: number; status: string }[]
}
export default function BackupDashboard() {
  const t = useT(),
    { pathname } = useRouter()
  const [data, setData] = createSignal<DashboardData>(),
    [loading, setLoading] = createSignal(false),
    [error, setError] = createSignal("")
  const [userPage, setUserPage] = createSignal(1),
    [historyPage, setHistoryPage] = createSignal(1),
    [userFilter, setUserFilter] = createSignal("")
  let resetUserPage = () => {},
    resetHistoryPage = () => {}
  const filteredUsers = () =>
    (data()?.users || []).filter((u) =>
      u.username.toLowerCase().includes(userFilter().toLowerCase()),
    )
  const view = () => pathname().split("/").pop() || "overview"
  const admin = () => me()?.role?.includes(2)
  const load = async () => {
    if (!admin()) return
    setLoading(true)
    setError("")
    try {
      const response = await fetch(
        joinBase("/share-app/backup-dashboard.php"),
        {
          headers: {
            Authorization: "Bearer " + (localStorage.getItem("token") || ""),
          },
          cache: "no-store",
        },
      )
      const result = await response.json()
      if (!response.ok || result.code !== 200)
        throw new Error(result.message || t("workspace.monitor_unavailable"))
      setData(result.data)
      setUserPage(1)
      setHistoryPage(1)
      resetUserPage()
      resetHistoryPage()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  onMount(load)
  const bytes = (n: number | null | undefined) => {
    if (n === null || n === undefined) return t("workspace.unknown")
    if (n === 0) return "0 B"
    const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), 4)
    return (
      new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(
        n / 1024 ** i,
      ) +
      " " +
      ["B", "KB", "MB", "GB", "TB"][i]
    )
  }
  const date = (value: number | string | null | undefined) => {
    if (!value) return "—"
    const number =
      typeof value === "number"
        ? value
        : /^\d+$/.test(value)
          ? Number(value)
          : undefined
    const d = new Date(
      number !== undefined ? number * (number < 1e12 ? 1000 : 1) : value,
    )
    return Number.isNaN(d.getTime())
      ? "—"
      : new Intl.DateTimeFormat("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(d)
  }
  const headers = (keys: string[]) => (
    <thead>
      <tr>
        <For each={keys}>
          {(key) => <th scope="col">{t("workspace." + key)}</th>}
        </For>
      </tr>
    </thead>
  )
  return (
    <Show when={admin()} fallback={<p>{t("workspace.admin_required")}</p>}>
      <div class="atp-data-stack">
        <div class="atp-list-tools">
          <nav class="atp-backup-subnav">
            <For
              each={[
                ["overview", "backup_capacity"],
                ["users", "backup_users"],
                ["schedules", "backup_schedules"],
              ]}
            >
              {([path, label]) => (
                <Link
                  href={joinBase("/@manage/backup/" + path)}
                  classList={{ active: view() === path }}
                >
                  {t("workspace." + label)}
                </Link>
              )}
            </For>
          </nav>
          <Button onClick={load} loading={loading()}>
            {t("global.refresh")}
          </Button>
        </div>
        <Show when={error()}>
          <p class="atp-alert" role="alert" data-error="true">
            {error()}
          </p>
        </Show>
        <Show
          when={data()}
          fallback={
            <Show when={!loading()}>
              <p class="atp-empty">{t("workspace.no_data")}</p>
            </Show>
          }
        >
          <p class="atp-data-time">
            {t("workspace.last_updated")}: {date(data()!.updated_at)} ·
            Asia/Ho_Chi_Minh (UTC+7)
          </p>
          <For each={data()!.sources || []}>
            {(source) => (
              <p class="atp-data-time">
                {source.host}: {date(source.updated_at)}
              </p>
            )}
          </For>
          <Show when={Date.now() / 1000 - data()!.updated_at > 900}>
            <p class="atp-alert">{t("workspace.stale_data")}</p>
          </Show>
          <For each={data()!.warnings || []}>
            {(warning) => <p class="atp-alert">{warning}</p>}
          </For>
          <Show when={view() === "overview"}>
            <section class="atp-metrics">
              <For
                each={[
                  [
                    t("workspace.known_capacity"),
                    bytes(data()!.totals.total_bytes),
                  ],
                  [
                    t("workspace.used_capacity"),
                    bytes(data()!.totals.used_bytes),
                  ],
                  [
                    t("workspace.unknown_capacity"),
                    String(data()!.totals.unknown_storages),
                  ],
                  [
                    t("workspace.active_jobs"),
                    String(data()!.totals.active_jobs),
                  ],
                ]}
              >
                {([label, value]) => (
                  <div class="atp-metric">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                )}
              </For>
            </section>
            <section class="atp-backup-panel">
              <h2>{t("workspace.storage")}</h2>
              <div class="atp-table-scroll">
                <table class="atp-data-table">
                  {headers([
                    "storage",
                    "provider",
                    "capacity",
                    "used",
                    "free",
                    "status",
                  ])}
                  <tbody>
                    <For each={data()!.storages}>
                      {(s) => (
                        <tr>
                          <td data-label={t("workspace.storage")}>
                            {s.mount_path}
                          </td>
                          <td data-label={t("workspace.provider")}>
                            {s.driver}
                          </td>
                          <td data-label={t("workspace.capacity")}>
                            {bytes(s.total_bytes)}
                          </td>
                          <td data-label={t("workspace.used")}>
                            {bytes(s.used_bytes)}
                          </td>
                          <td data-label={t("workspace.free")}>
                            {bytes(s.free_bytes)}
                          </td>
                          <td data-label={t("workspace.status")}>{s.status}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </section>
            <p class="atp-data-note">{t("workspace.quota_note")}</p>
          </Show>
          <Show when={view() === "users"}>
            <section class="atp-backup-panel">
              <h2>{t("workspace.backup_users")}</h2>
              <div class="atp-table-tools">
                <Input
                  aria-label={t("workspace.user")}
                  placeholder={t("workspace.user")}
                  value={userFilter()}
                  onInput={(e) => {
                    setUserFilter(e.currentTarget.value)
                    setUserPage(1)
                    resetUserPage()
                  }}
                />
              </div>
              <Show
                when={filteredUsers().length}
                fallback={<p class="atp-empty">{t("workspace.no_data")}</p>}
              >
                <div class="atp-table-scroll">
                  <table class="atp-data-table">
                    {headers([
                      "user",
                      "server",
                      "source_size",
                      "backup_size",
                      "last_backup",
                      "method",
                    ])}
                    <tbody>
                      <For
                        each={filteredUsers().slice(
                          (userPage() - 1) * 20,
                          userPage() * 20,
                        )}
                      >
                        {(u) => (
                          <tr>
                            <td data-label={t("workspace.user")}>
                              {u.username}
                              <small>{u.backup_count} backup</small>
                            </td>
                            <td data-label={t("workspace.server")}>
                              {u.server}
                            </td>
                            <td data-label={t("workspace.source_size")}>
                              {bytes(u.source_bytes)}
                            </td>
                            <td data-label={t("workspace.backup_size")}>
                              {bytes(u.backup_bytes)}
                            </td>
                            <td data-label={t("workspace.last_backup")}>
                              {date(u.last_backup)}
                            </td>
                            <td data-label={t("workspace.method")}>
                              {u.method || "—"}
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
                <div class="atp-table-pagination">
                  <span>
                    {Math.min(
                      filteredUsers().length,
                      (userPage() - 1) * 20 + 1,
                    )}
                    –{Math.min(userPage() * 20, filteredUsers().length)} /{" "}
                    {filteredUsers().length}
                  </span>
                  <Paginator
                    total={filteredUsers().length}
                    defaultPageSize={20}
                    onChange={setUserPage}
                    setResetCallback={(fn) => (resetUserPage = fn)}
                  />
                </div>
              </Show>
            </section>
            <p class="atp-data-note">{t("workspace.physical_note")}</p>
          </Show>
          <Show when={view() === "schedules"}>
            <p class="atp-alert">{t("workspace.cron_note")}</p>
            <section class="atp-backup-panel">
              <h2>{t("workspace.schedule")}</h2>
              <div class="atp-table-scroll">
                <table class="atp-data-table">
                  {headers([
                    "schedule",
                    "destination",
                    "method",
                    "scope",
                    "cycle",
                    "next_run",
                    "status",
                    "retention",
                  ])}
                  <tbody>
                    <For each={data()!.schedules}>
                      {(s) => (
                        <tr>
                          <td data-label={t("workspace.schedule")}>
                            {s.name}
                            <small>{s.id}</small>
                          </td>
                          <td data-label={t("workspace.destination")}>
                            {s.destination || "—"}
                          </td>
                          <td data-label={t("workspace.method")}>
                            {s.method || "—"}
                          </td>
                          <td data-label={t("workspace.scope")}>
                            {s.scope || "—"}
                          </td>
                          <td data-label={t("workspace.cycle")}>
                            {s.cron}
                            <small>{s.source_timezone}</small>
                          </td>
                          <td data-label={t("workspace.next_run")}>
                            {date(s.next_run)}
                          </td>
                          <td data-label={t("workspace.status")}>
                            <span
                              class="atp-badge"
                              data-state={s.enabled ? "ok" : "warning"}
                            >
                              {s.enabled
                                ? t("global.enable")
                                : t("global.disable")}
                            </span>
                          </td>
                          <td data-label={t("workspace.retention")}>
                            {s.retention || "—"}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </section>
            <section class="atp-backup-panel">
              <h2>{t("workspace.backup_schedules")}</h2>
              <Show
                when={data()!.history.length}
                fallback={<p class="atp-empty">{t("workspace.no_data")}</p>}
              >
                <div class="atp-table-scroll">
                  <table class="atp-data-table">
                    {headers([
                      "user",
                      "method",
                      "created",
                      "started",
                      "finished",
                      "duration",
                      "result",
                    ])}
                    <tbody>
                      <For
                        each={data()!.history.slice(
                          (historyPage() - 1) * 20,
                          historyPage() * 20,
                        )}
                      >
                        {(h) => (
                          <tr>
                            <td data-label={t("workspace.user")}>
                              {h.user}
                              <small>{h.server}</small>
                            </td>
                            <td data-label={t("workspace.method")}>
                              {h.method}
                            </td>
                            <td data-label={t("workspace.created")}>
                              {date(h.created)}
                            </td>
                            <td data-label={t("workspace.started")}>
                              {date(h.started)}
                            </td>
                            <td data-label={t("workspace.finished")}>
                              {date(h.ended)}
                            </td>
                            <td data-label={t("workspace.duration")}>
                              {h.duration === null
                                ? "—"
                                : new Intl.NumberFormat().format(h.duration) +
                                  " s"}
                            </td>
                            <td data-label={t("workspace.result")}>
                              {h.status}
                              <Show when={h.error}>
                                <small>{h.error}</small>
                              </Show>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
                <div class="atp-table-pagination">
                  <span>
                    {Math.min(
                      data()!.history.length,
                      (historyPage() - 1) * 20 + 1,
                    )}
                    –{Math.min(historyPage() * 20, data()!.history.length)} /{" "}
                    {data()!.history.length}
                  </span>
                  <Paginator
                    total={data()!.history.length}
                    defaultPageSize={20}
                    onChange={setHistoryPage}
                    setResetCallback={(fn) => (resetHistoryPage = fn)}
                  />
                </div>
              </Show>
            </section>
          </Show>
        </Show>
      </div>
    </Show>
  )
}

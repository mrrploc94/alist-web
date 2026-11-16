import { createSignal, For, onMount, Show } from "solid-js"
import { Link } from "@solidjs/router"
import { Button, Input } from "@hope-ui/solid"
import { useT } from "~/hooks"
import { joinBase, notify } from "~/utils"
import { DeletePopover } from "./common/DeletePopover"

interface Share {
  id: number
  file_path: string
  share_id: string
  share_url?: string
  expires_at?: string
  download_count: number
  max_downloads?: number
  note?: string
  is_active?: number
}
export default function CustomShares() {
  const t = useT(),
    [shares, setShares] = createSignal<Share[]>([]),
    [loading, setLoading] = createSignal(true),
    [error, setError] = createSignal(""),
    [filter, setFilter] = createSignal("")
  const call = async (action: string, body?: object) => {
    const response = await fetch(
      joinBase("/share-app/api.php") + "?action=" + action,
      {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: "Bearer " + (localStorage.getItem("token") || ""),
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    )
    const result = await response.json()
    if (!response.ok || result.code !== 200)
      throw new Error(result.message || t("workspace.fetch_failed"))
    return result.data
  }
  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await call("list")
      setShares(Array.isArray(data) ? data : data?.shares || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  const remove = async (share: Share) => {
    try {
      await call("delete", { id: share.id })
      notify.success(t("global.delete_success"))
      await load()
    } catch (e) {
      notify.error((e as Error).message)
    }
  }
  const copy = async (share: Share) => {
    const url =
      share.share_url ||
      new URL(joinBase("/s/" + share.share_id), location.origin).href
    await navigator.clipboard.writeText(url)
    notify.success(t("global.copied"))
  }
  onMount(load)
  const filtered = () =>
    shares().filter((s) =>
      (s.file_path + " " + (s.note || ""))
        .toLowerCase()
        .includes(filter().toLowerCase()),
    )
  return (
    <div class="atp-data-stack">
      <nav class="atp-share-types">
        <Link href={joinBase("/@manage/shares")}>
          {t("workspace.native_shares")}
        </Link>
        <Link class="active" href={joinBase("/@manage/custom-shares")}>
          {t("workspace.custom_shares")}
        </Link>
      </nav>
      <div class="atp-list-tools">
        <Input
          aria-label={t("workspace.search_shares")}
          placeholder={t("workspace.search_shares")}
          value={filter()}
          onInput={(e) => setFilter(e.currentTarget.value)}
        />
        <Button onClick={load} loading={loading()}>
          {t("global.refresh")}
        </Button>
      </div>
      <Show when={error()}>
        <p class="atp-alert" data-error="true" role="alert">
          {error()}
        </p>
      </Show>
      <Show
        when={!loading()}
        fallback={<p class="atp-empty">{t("global.loading")}</p>}
      >
        <Show
          when={filtered().length}
          fallback={<p class="atp-empty">{t("workspace.no_shares")}</p>}
        >
          <div class="atp-table-scroll">
            <table class="atp-data-table">
              <thead>
                <tr>
                  <For
                    each={["file", "expiry", "downloads", "note", "actions"]}
                  >
                    {(key) => <th scope="col">{t("workspace." + key)}</th>}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={filtered()}>
                  {(share) => (
                    <tr>
                      <td data-label={t("workspace.file")}>
                        {share.file_path}
                        <small>{share.share_id}</small>
                      </td>
                      <td data-label={t("workspace.expiry")}>
                        {share.expires_at || t("workspace.no_expiry")}
                      </td>
                      <td data-label={t("workspace.downloads")}>
                        {share.download_count || 0} /{" "}
                        {share.max_downloads || "∞"}
                      </td>
                      <td data-label={t("workspace.note")}>
                        {share.note || "—"}
                      </td>
                      <td data-label={t("workspace.actions")}>
                        <div class="atp-row-actions">
                          <Button size="sm" onClick={() => copy(share)}>
                            {t("global.copy")}
                          </Button>
                          <DeletePopover
                            name={share.file_path}
                            loading={loading()}
                            onClick={() => remove(share)}
                            buttonText={t("workspace.revoke")}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
    </div>
  )
}

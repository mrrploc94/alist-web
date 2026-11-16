import { Input } from "@hope-ui/solid"
import { ComponentProps, createSignal, Show, splitProps } from "solid-js"
import { FiEye, FiEyeOff } from "solid-icons/fi"
import { useT } from "~/hooks"
export const MaskedInput = (
  props: ComponentProps<typeof Input> & { secret?: boolean },
) => {
  const [local, rest] = splitProps(props, ["secret", "type"])
  const [revealed, setRevealed] = createSignal(false)
  const t = useT()
  const secret = () => local.secret ?? local.type === "password"
  return (
    <Show when={secret()} fallback={<Input {...rest} type={local.type} />}>
      <div class="atp-secret-input">
        <Input {...rest} type={revealed() ? "text" : "password"} />
        <button
          type="button"
          class="atp-icon-button"
          aria-label={t(
            revealed() ? "workspace.hide_secret" : "workspace.show_secret",
          )}
          aria-pressed={revealed()}
          onClick={() => setRevealed(!revealed())}
        >
          {revealed() ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </Show>
  )
}

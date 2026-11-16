import { Markdown } from "~/components"
import { useTitle } from "~/hooks"
import { getSetting } from "~/store"
import { notify } from "~/utils"
import CreateShareDialog from "~/components/CreateShareDialog"
import { Body } from "./Body"
import { Footer } from "./Footer"
import { Header } from "./header/Header"
import { Toolbar } from "./toolbar/Toolbar"
import {
  ExplorerHeader,
  ExplorerHeading,
  ExplorerTree,
} from "./WorkspaceExplorer"
import { useT } from "~/hooks"

const Index = () => {
  const t = useT()
  useTitle(getSetting("site_title"))
  const announcement = getSetting("announcement")
  if (announcement) {
    notify.render(() => <Markdown children={announcement} />)
  }
  return (
    <div class="atp-app atp-file-workspace">
      <ExplorerHeader />
      <ExplorerHeading />
      <Toolbar />
      <div class="atp-file-body">
        <aside class="atp-file-side">
          <h2>{t("workspace.folders")}</h2>
          <ExplorerTree />
        </aside>
        <main class="atp-file-main">
          <Body />
        </main>
      </div>
      <CreateShareDialog />
      <Footer />
    </div>
  )
}

export default Index

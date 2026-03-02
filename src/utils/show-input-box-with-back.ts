import { QuickInputButtons, window } from "vscode"

export function showInputBoxWithBack(options: {
  title: string
  prompt?: string
  value?: string
  placeholder?: string
  password?: boolean
  validate?: (v: string) => string | null | undefined
  onBack: () => Promise<void>
  onAccept: (value: string) => Promise<void> | void
}): Promise<void> {
  return new Promise<void>((resolve) => {
    const ib = window.createInputBox()
    ib.title = options.title
    ib.prompt = options.prompt ?? ''
    ib.value = options.value ?? ''
    ib.placeholder = options.placeholder ?? ''
    ib.password = options.password ?? false
    ib.ignoreFocusOut = true
    ib.buttons = [QuickInputButtons.Back]

    ib.onDidChangeValue((v) => {
      ib.validationMessage = options.validate?.(v) ?? ''
    })
    ib.onDidTriggerButton(async (btn) => {
      if (btn === QuickInputButtons.Back) {
        ib.hide()
        await options.onBack()
        resolve()
      }
    })
    ib.onDidAccept(async () => {
      const msg = options.validate?.(ib.value)
      if (msg) {
        ib.validationMessage = msg
        return
      }
      const value = ib.value
      ib.hide()
      await options.onAccept(value)
      resolve()
    })
    ib.onDidHide(() => resolve())
    ib.show()
  })
}

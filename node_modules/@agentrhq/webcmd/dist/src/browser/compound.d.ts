/**
 * Compound-component expansion for high-agent-failure form controls.
 *
 * Agents burn turns on three recurring input categories because the raw
 * attribute dump from `browser state` under-specifies them:
 *
 *   - date / time / datetime-local / month / week — agents type
 *     free-form strings and the browser silently ignores mismatched formats.
 *   - select — the snapshot caps visible options at ~6; agents don't know
 *     the full option set, can't match by label, and waste turns clicking
 *     to open the dropdown just to read options.
 *   - file — the snapshot shows current filenames but not `accept` or
 *     `multiple`; agents re-upload or pick unsupported MIME types.
 *
 * `compoundInfoOf(el)` returns a structured JSON summary agents can rely
 * on. Included in `browser find --css` envelope so the agent gets the
 * rich view without extra round-trips.
 *
 * Emitted as a JS source string (`COMPOUND_INFO_JS`) so it can be inlined
 * into the generated evaluate scripts under find / snapshot / eval.
 */
export type DateLikeControl = 'date' | 'time' | 'datetime-local' | 'month' | 'week';
export interface DateCompound {
    control: DateLikeControl;
    format: string;
    current: string;
    min?: string;
    max?: string;
}
export interface SelectOption {
    label: string;
    value: string;
    selected: boolean;
    disabled?: boolean;
}
export interface SelectCompound {
    control: 'select';
    multiple: boolean;
    current: string | string[];
    options: SelectOption[];
    options_total: number;
}
export interface FileCompound {
    control: 'file';
    multiple: boolean;
    current: string[];
    accept?: string;
}
export type CompoundInfo = DateCompound | SelectCompound | FileCompound;
/** Max options included in a SelectCompound.options[]. Above this, `options_total` still reflects the true count. */
export declare const COMPOUND_SELECT_OPTIONS_CAP = 50;
/** Max characters per option label / file name. */
export declare const COMPOUND_LABEL_CAP = 80;
/**
 * JavaScript source declaring `compoundInfoOf(el)`. Inlined into the JS
 * emitted by `buildFindJs` (and any other evaluate script that needs the
 * rich compound view). Returns a `CompoundInfo` object or `null`.
 */
export declare const COMPOUND_INFO_JS = "\nfunction compoundInfoOf(el) {\n  if (!el || !el.tagName) return null;\n  const tag = el.tagName;\n  const LABEL_CAP = 80;\n  const OPTS_CAP = 50;\n  if (tag === 'INPUT') {\n    const type = (el.getAttribute('type') || 'text').toLowerCase();\n    const FORMATS = {\n      'date': 'YYYY-MM-DD',\n      'time': 'HH:MM',\n      'datetime-local': 'YYYY-MM-DDTHH:MM',\n      'month': 'YYYY-MM',\n      'week': 'YYYY-W##',\n    };\n    if (FORMATS[type]) {\n      const info = {\n        control: type,\n        format: FORMATS[type],\n        current: (el.value == null ? '' : String(el.value)),\n      };\n      const min = el.getAttribute('min');\n      if (min) info.min = min;\n      const max = el.getAttribute('max');\n      if (max) info.max = max;\n      return info;\n    }\n    if (type === 'file') {\n      const info = {\n        control: 'file',\n        multiple: !!el.multiple,\n        current: [],\n      };\n      const accept = el.getAttribute('accept');\n      if (accept) info.accept = accept;\n      try {\n        if (el.files && el.files.length) {\n          for (let i = 0; i < el.files.length; i++) {\n            const name = (el.files[i].name || '').slice(0, LABEL_CAP);\n            info.current.push(name);\n          }\n        }\n      } catch (_) {}\n      return info;\n    }\n    return null;\n  }\n  if (tag === 'SELECT') {\n    const multiple = !!el.multiple;\n    const options = [];\n    const selectedLabels = [];\n    let total = 0;\n    try {\n      const opts = el.options || [];\n      total = opts.length;\n      // Walk ALL options so `current` reflects selections that sit beyond the\n      // serialization cap. Only the first OPTS_CAP entries get pushed into\n      // options[]; anything past the cap still contributes to selectedLabels\n      // so agents see the true current state of big dropdowns.\n      for (let i = 0; i < opts.length; i++) {\n        const o = opts[i];\n        const labelRaw = (o.label != null && o.label !== '') ? o.label : (o.text || '');\n        const label = String(labelRaw).trim().slice(0, LABEL_CAP);\n        if (i < OPTS_CAP) {\n          const entry = { label: label, value: o.value, selected: !!o.selected };\n          if (o.disabled) entry.disabled = true;\n          options.push(entry);\n        }\n        if (o.selected) selectedLabels.push(label);\n      }\n    } catch (_) {}\n    return {\n      control: 'select',\n      multiple: multiple,\n      current: multiple ? selectedLabels : (selectedLabels[0] || ''),\n      options: options,\n      options_total: total,\n    };\n  }\n  return null;\n}\n";

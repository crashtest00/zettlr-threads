/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        LinkRenderer
 * CVM-Role:        View
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     This renderer can render links and URLs.
 *
 * END HEADER
 */

import { type EditorView, type DecorationSet, ViewPlugin, type ViewUpdate, Decoration, WidgetType } from '@codemirror/view'
import type { RangeSet, Range } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'
import { rangeInSelection } from '../util/range-in-selection'
import { configField } from '../util/configuration'
import { OPEN_COMMENT_LABEL, parseCommentMarkerFragment, RESOLVED_COMMENT_LABEL } from '../comments/markers'
import { trans } from 'source/common/i18n-renderer'

export function createCommentMarkerDOM (id: string, resolved: boolean): HTMLElement {
  const marker = document.createElement('span')
  marker.className = 'cm-comment-thread-marker'
  marker.dataset.commentThreadId = id
  const label = resolved ? trans('Open resolved comment thread') : trans('Open comment thread')
  marker.title = label
  marker.setAttribute('aria-label', label)

  const icon = document.createElement('cds-icon')
  icon.setAttribute('aria-hidden', 'true')
  icon.setAttribute('shape', resolved ? 'check' : 'chat-bubble')
  icon.setAttribute('solid', 'true')
  icon.setAttribute('size', 'sm')
  marker.appendChild(icon)
  return marker
}

export function renderCommentMarkerLinks (container: ParentNode): void {
  for (const link of container.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const id = parseCommentMarkerFragment(link.getAttribute('href') ?? '')
    const label = link.textContent
    if (
      id !== undefined &&
      (label === OPEN_COMMENT_LABEL || label === RESOLVED_COMMENT_LABEL)
    ) {
      link.replaceChildren(createCommentMarkerDOM(id, label === RESOLVED_COMMENT_LABEL))
    }
  }
}

class CommentMarkerWidget extends WidgetType {
  constructor (
    readonly id: string,
    readonly resolved: boolean
  ) {
    super()
  }

  eq (other: CommentMarkerWidget): boolean {
    return other.id === this.id && other.resolved === this.resolved
  }

  toDOM (): HTMLElement {
    return createCommentMarkerDOM(this.id, this.resolved)
  }

  ignoreEvent (): boolean {
    return false
  }
}

function hideLinkMarkers (view: EditorView): RangeSet<Decoration> {
  const ranges: Array<Range<Decoration>> = []
  const hiddenDeco = Decoration.replace({})
  const includeAdjacent = view.state.field(configField, false)?.previewModeShowSyntaxWhenCursorIsAdjacent ?? true

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter (node) {
        if (node.name !== 'Link' && node.name !== 'ZknLink') {
          return
        }

        if (node.name === 'Link') {
          const marks = node.node.getChildren('LinkMark')
          const urlNode = node.node.getChild('URL')
          if (marks.length >= 3 && urlNode !== null) {
            const id = parseCommentMarkerFragment(view.state.sliceDoc(urlNode.from, urlNode.to))
            const markerLabel = view.state.sliceDoc(marks[0].to, marks[1].from)
            if (
              id !== undefined &&
              (markerLabel === OPEN_COMMENT_LABEL || markerLabel === RESOLVED_COMMENT_LABEL)
            ) {
              ranges.push(Decoration.replace({
                widget: new CommentMarkerWidget(id, markerLabel === RESOLVED_COMMENT_LABEL)
              }).range(node.from, node.to))
              return false
            }
          }
        }

        // Do not hide any characters if a selection is inside here
        if (rangeInSelection(view.state.selection, node.from, node.to, includeAdjacent)) {
          return false
        }

        if (node.name === 'ZknLink') {
          const contentNode = node.node.getChild('ZknLinkContent')
          const titleNode = node.node.getChild('ZknLinkTitle')
          const pipeNode = node.node.getChild('ZknLinkPipe')
          if (contentNode !== null && titleNode !== null && pipeNode !== null) {
            ranges.push(
              hiddenDeco.range(contentNode.from, contentNode.to),
              hiddenDeco.range(pipeNode.from, pipeNode.to)
            )
          }
        } else {
          // It's a regular Markdown Link
          const marks = node.node.getChildren('LinkMark')
          const label = node.node.getChild('LinkLabel')

          // We need at least three LinkMarks for regular links: [, ], and (
          // since the parser will also parse ellipses as Links (a.k.a.
          // reference style links). Alternatively, it needs to have a LinkLabel
          // child node
          if (marks.length < 3 && !label ) {
            return false
          }

          if (marks[0].to === marks[1].from) {
            return false // Empty link title -> would hide the entire link
          }

          ranges.push(
            hiddenDeco.range(marks[0].from, marks[0].to),
            hiddenDeco.range(marks[1].from, label ? label.to : marks[marks.length - 1].to)
          )
        }
      }
    })
  }

  return Decoration.set(ranges, true)
}

export const renderLinks = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor (view: EditorView) {
    this.decorations = hideLinkMarkers(view)
  }

  update (update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = hideLinkMarkers(update.view)
    }
  }
}, {
  decorations: v => v.decorations
})

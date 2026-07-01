<template>
  <div id="sidebar-comments" class="comments-tab">
    <form
      v-if="draft !== undefined"
      class="comment-draft"
      v-on:submit.prevent="submitDraft"
    >
      <h1>{{ trans('New comment thread') }}</h1>
      <textarea
        ref="draftInput"
        v-model="draftBody"
        v-bind:aria-label="trans('Comment text')"
        rows="8"
      ></textarea>
      <div>
        <button type="button" v-on:click="emit('cancel-draft')">
          {{ trans('Cancel') }}
        </button>
        <button type="submit" v-bind:disabled="draftBody.trim().length === 0">
          {{ trans('Create thread') }}
        </button>
      </div>
    </form>
    <template v-else-if="selectedThread !== undefined">
      <header class="comment-thread-header">
        <div>
          <h1>{{ trans('Comment thread') }}</h1>
          <span v-bind:class="['comment-thread-status', selectedThread.status]">
            {{ threadStatus }}
          </span>
        </div>
        <div class="comment-thread-actions">
          <button
            type="button"
            v-bind:disabled="selectedThread.status === 'resolved'"
            v-on:click="emit('resolve')"
          >
            {{ trans('Resolve') }}
          </button>
          <button
            type="button"
            class="danger"
            v-on:click="emit('delete-thread')"
          >
            {{ trans('Delete thread') }}
          </button>
        </div>
      </header>

      <div class="comment-messages">
        <article
          v-for="(message, index) in selectedThread.messages"
          v-bind:key="`${message.timestamp}-${index}`"
          class="comment-message"
        >
          <header>
            <div>
              <strong>{{ message.author }}</strong>
              <time>{{ message.timestamp }}</time>
            </div>
            <button
              type="button"
              class="icon-button"
              v-bind:title="trans('Edit comment')"
              v-bind:aria-label="trans('Edit comment')"
              v-on:click="startEditing(index, message.body)"
            >
              <cds-icon shape="pencil" size="sm"></cds-icon>
            </button>
          </header>
          <form
            v-if="editingMessageIndex === index"
            class="comment-edit"
            v-on:submit.prevent="submitEdit(index)"
          >
            <textarea
              v-model="editingBody"
              v-bind:aria-label="trans('Edit comment text')"
              rows="5"
            ></textarea>
            <div>
              <button type="button" v-on:click="cancelEditing">
                {{ trans('Cancel') }}
              </button>
              <button type="submit" v-bind:disabled="editingBody.trim().length === 0">
                {{ trans('Save') }}
              </button>
            </div>
          </form>
          <p v-else>
            {{ message.body }}
          </p>
        </article>
      </div>

      <form class="comment-reply" v-on:submit.prevent="submitReply">
        <textarea
          ref="replyInput"
          v-model="replyBody"
          v-bind:aria-label="trans('Reply text')"
          rows="5"
        ></textarea>
        <button type="submit" v-bind:disabled="replyBody.trim().length === 0">
          {{ trans('Reply') }}
        </button>
      </form>
    </template>
    <p v-else class="comment-empty-state">
      {{ trans('No comment thread selected.') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useWindowStateStore } from 'source/pinia'
import { trans } from '@common/i18n-renderer'

const emit = defineEmits<{
  (e: 'append-reply', body: string): void
  (e: 'edit-message', payload: { index: number, body: string }): void
  (e: 'create-thread', body: string): void
  (e: 'cancel-draft'): void
  (e: 'resolve'): void
  (e: 'delete-thread'): void
}>()

const windowStateStore = useWindowStateStore()
const replyBody = ref('')
const editingMessageIndex = ref<number|undefined>(undefined)
const editingBody = ref('')
const replyInput = ref<HTMLTextAreaElement|null>(null)
const draftInput = ref<HTMLTextAreaElement|null>(null)
const draftBody = ref('')
const selectedThread = computed(() => windowStateStore.selectedCommentThread)
const draft = computed(() => windowStateStore.commentThreadDraft)
const threadStatus = computed(() => {
  return selectedThread.value?.status === 'resolved'
    ? trans('Resolved')
    : trans('Open')
})

watch(draft, (newDraft) => {
  draftBody.value = newDraft?.body ?? ''
  if (newDraft !== undefined) {
    nextTick()
      .then(() => {
        draftInput.value?.focus()
        draftInput.value?.setSelectionRange(draftBody.value.length, draftBody.value.length)
      })
      .catch(err => console.error(err))
  }
}, { immediate: true })

watch(() => selectedThread.value?.id, () => {
  replyBody.value = ''
  cancelEditing()
  nextTick()
    .then(() => replyInput.value?.focus())
    .catch(err => console.error(err))
})

function submitReply (): void {
  const body = replyBody.value.trim()
  if (body.length === 0) {
    return
  }

  emit('append-reply', body)
  replyBody.value = ''
  nextTick()
    .then(() => replyInput.value?.focus())
    .catch(err => console.error(err))
}

function submitDraft (): void {
  if (draftBody.value.trim().length > 0) {
    emit('create-thread', draftBody.value)
  }
}

function startEditing (index: number, body: string): void {
  editingMessageIndex.value = index
  editingBody.value = body
}

function cancelEditing (): void {
  editingMessageIndex.value = undefined
  editingBody.value = ''
}

function submitEdit (index: number): void {
  const body = editingBody.value.trim()
  if (body.length === 0) {
    return
  }

  emit('edit-message', { index, body })
  cancelEditing()
}
</script>

<style lang="less">
.comments-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .comment-thread-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;

    h1 {
      margin: 0 0 4px 0;
    }

  }

  .comment-draft {
    display: flex;
    flex-direction: column;
    gap: 8px;

    h1 {
      margin: 0;
    }

    textarea {
      box-sizing: border-box;
      min-height: 120px;
      resize: vertical;
      width: 100%;
    }

    div {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }

  .comment-thread-actions {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 6px;

    button {
      white-space: nowrap;
    }

    button.danger {
      color: rgb(190, 40, 40);
    }
  }

  .comment-thread-status {
    display: inline-block;
    font-size: 11px;
    text-transform: uppercase;
    color: var(--system-accent-color);

    &.resolved {
      opacity: 0.65;
    }
  }

  .comment-messages {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .comment-message {
    border-left: 2px solid var(--system-accent-color);
    padding-left: 8px;

    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2px;
      margin-bottom: 6px;
      font-size: 12px;
    }

    header div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    button.icon-button {
      align-items: center;
      background: transparent;
      border: 0;
      cursor: pointer;
      display: flex;
      flex-shrink: 0;
      height: 22px;
      justify-content: center;
      padding: 0;
      width: 22px;
    }

    time {
      opacity: 0.7;
    }

    p {
      margin: 0;
      white-space: pre-wrap;
    }
  }

  .comment-edit {
    display: flex;
    flex-direction: column;
    gap: 8px;

    textarea {
      box-sizing: border-box;
      min-height: 90px;
      resize: vertical;
      width: 100%;
    }

    div {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }

  .comment-reply {
    display: flex;
    flex-direction: column;
    gap: 8px;

    textarea {
      resize: vertical;
      min-height: 90px;
      width: 100%;
      box-sizing: border-box;
    }

    button {
      align-self: flex-end;
    }
  }

  .comment-empty-state {
    margin: 0;
    opacity: 0.7;
  }
}
</style>

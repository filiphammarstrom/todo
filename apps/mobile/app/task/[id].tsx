import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTaskMutations, useSubtasks } from '@todo/store'
import { useSupabase } from '../../src/context/SupabaseContext'
import { useAuthStore } from '@todo/store'
import { useQueryClient } from '@tanstack/react-query'
import type { Database } from '@todo/core'
import TaskRow from '../../src/components/TaskRow'

type TaskUpdate = Database['public']['Tables']['tasks']['Update']

const PRIORITY_LABELS: Record<number, string> = {
  1: 'P1 – Brådskande',
  2: 'P2 – Hög',
  3: 'P3 – Medel',
  4: 'P4 – Låg',
}

const PRIORITY_COLORS: Record<number, string> = {
  1: '#FF3B30',
  2: '#FF9500',
  3: '#007AFF',
  4: '#8E8E93',
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const supabase = useSupabase()
  const qc = useQueryClient()

  const { update, complete, remove } = useTaskMutations(supabase)
  const { data: subtasks = [] } = useSubtasks(supabase, id)

  // Fetch task from query cache
  const allTasks = qc.getQueriesData<any[]>({ queryKey: ['tasks'] })
  let task: any = null
  for (const [, data] of allTasks) {
    if (Array.isArray(data)) {
      const found = data.find((t) => t.id === id)
      if (found) { task = found; break }
    }
  }

  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [priority, setPriority] = useState<number>(task?.priority ?? 4)

  useEffect(() => {
    if (task) {
      setTitle(task.title ?? '')
      setNotes(task.notes ?? '')
      setPriority(task.priority ?? 4)
    }
  }, [task?.id])

  if (!task) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  function saveField(field: keyof TaskUpdate, value: any) {
    update.mutate({ id: id!, updates: { [field]: value } })
  }

  function handleDelete() {
    Alert.alert('Ta bort uppgift', 'Är du säker?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: () => {
          remove.mutate(id!)
          router.back()
        },
      },
    ])
  }

  const isBlocked = !!task.blocked_by_task_id && task.status === 'open'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isBlocked && (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedText}>🔒 Blockerad av en annan uppgift</Text>
        </View>
      )}

      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        onBlur={() => saveField('title', title)}
        placeholder="Uppgiftstitel"
        multiline
        editable={!isBlocked}
      />

      {/* Priority picker */}
      <Text style={styles.label}>Prioritet</Text>
      <View style={styles.priorityRow}>
        {([1, 2, 3, 4] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.priorityButton,
              priority === p && { backgroundColor: PRIORITY_COLORS[p] },
            ]}
            onPress={() => {
              setPriority(p)
              saveField('priority', p)
            }}
            disabled={isBlocked}
          >
            <Text style={[styles.priorityButtonText, priority === p && styles.priorityButtonTextActive]}>
              P{p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Due date */}
      {task.due_date && (
        <>
          <Text style={styles.label}>Deadline</Text>
          <Text style={styles.value}>
            {new Date(task.due_date).toLocaleDateString('sv-SE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </>
      )}

      {/* Notes */}
      <Text style={styles.label}>Anteckningar</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        onBlur={() => saveField('notes', notes)}
        placeholder="Lägg till anteckningar..."
        multiline
        textAlignVertical="top"
        editable={!isBlocked}
      />

      {/* Subtasks */}
      {subtasks.length > 0 && (
        <>
          <Text style={styles.label}>Deluppgifter</Text>
          <View style={styles.subtasksContainer}>
            {subtasks.map((sub, i) => {
              const prevCompleted = i === 0 || subtasks[i - 1].status === 'completed'
              const isSubBlocked = !prevCompleted && sub.status !== 'completed'
              return (
                <TaskRow
                  key={sub.id}
                  task={sub}
                  onComplete={(subId) => complete.mutate(subId)}
                  blocked={isSubBlocked}
                />
              )
            })}
          </View>
        </>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {task.status !== 'completed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => {
              complete.mutate(id!)
              router.back()
            }}
            disabled={isBlocked}
          >
            <Text style={styles.completeButtonText}>Markera som klar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Ta bort uppgift</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  blockedText: {
    color: '#856404',
    fontSize: 14,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    minHeight: 56,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  notesInput: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    minHeight: 100,
  },
  subtasksContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
})

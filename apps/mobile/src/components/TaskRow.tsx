import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import type { Task } from '@todo/core'

const PRIORITY_COLORS: Record<number, string> = {
  1: '#FF3B30',
  2: '#FF9500',
  3: '#007AFF',
  4: '#8E8E93',
}

interface TaskRowProps {
  task: Task
  onComplete: (id: string) => void
  blocked?: boolean
}

export default function TaskRow({ task, onComplete, blocked = false }: TaskRowProps) {
  const router = useRouter()
  const priorityColor = PRIORITY_COLORS[task.priority ?? 4]

  return (
    <TouchableOpacity
      style={[styles.row, task.status === 'completed' && styles.completed, blocked && styles.blocked]}
      onPress={() => !blocked && router.push(`/task/${task.id}`)}
      disabled={blocked}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={[styles.checkbox, { borderColor: priorityColor }]}
        onPress={() => !blocked && onComplete(task.id)}
        disabled={blocked}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {task.status === 'completed' && (
          <View style={[styles.checkFill, { backgroundColor: priorityColor }]} />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[styles.title, task.status === 'completed' && styles.titleCompleted]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        {task.due_date && (
          <Text style={styles.dueDate}>
            {new Date(task.due_date).toLocaleDateString('sv-SE', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        )}
      </View>

      {blocked && (
        <Text style={styles.lockIcon}>🔒</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  completed: {
    opacity: 0.5,
  },
  blocked: {
    opacity: 0.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#000',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  dueDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  lockIcon: {
    fontSize: 14,
  },
})

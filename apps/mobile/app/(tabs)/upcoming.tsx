import { View, SectionList, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useUpcomingTasks, useTaskMutations } from '@todo/store'
import { useSupabase } from '../../src/context/SupabaseContext'
import { useAuthStore } from '@todo/store'
import TaskRow from '../../src/components/TaskRow'
import AddTaskFAB from '../../src/components/AddTaskFAB'
import type { Task } from '@todo/core'

function groupByDate(tasks: Task[]): { title: string; data: Task[] }[] {
  const map = new Map<string, Task[]>()
  for (const task of tasks) {
    const key = task.due_date
      ? new Date(task.due_date).toLocaleDateString('sv-SE', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      : 'Inget datum'
    const group = map.get(key) ?? []
    group.push(task)
    map.set(key, group)
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
}

export default function UpcomingScreen() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''

  const { data: tasks = [], isLoading } = useUpcomingTasks(supabase, userId)
  const { complete } = useTaskMutations(supabase)

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  const sections = groupByDate(tasks)

  return (
    <View style={styles.container}>
      {sections.length === 0 ? (
        <Text style={styles.empty}>Inga kommande uppgifter</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onComplete={(id) => complete.mutate(id)}
            />
          )}
        />
      )}
      <AddTaskFAB />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
    textTransform: 'capitalize',
    backgroundColor: '#F2F2F7',
  },
  empty: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 60,
    fontSize: 16,
  },
})

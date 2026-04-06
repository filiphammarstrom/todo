import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useInboxTasks, useTodayTasks, useTaskMutations } from '@todo/store'
import { useSupabase } from '../../src/context/SupabaseContext'
import { useAuthStore } from '@todo/store'
import TaskRow from '../../src/components/TaskRow'
import AddTaskFAB from '../../src/components/AddTaskFAB'
import type { Task } from '@todo/core'

export default function InboxScreen() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''

  const { data: todayTasks = [], isLoading: loadingToday } = useTodayTasks(supabase, userId)
  const { data: inboxTasks = [], isLoading: loadingInbox } = useInboxTasks(supabase, userId)
  const { complete } = useTaskMutations(supabase)

  const isLoading = loadingToday || loadingInbox

  function renderSection(title: string, tasks: Task[]) {
    if (tasks.length === 0) return null
    return (
      <>
        <Text style={styles.sectionHeader}>{title}</Text>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={(id) => complete.mutate(id)}
          />
        ))}
      </>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        ListHeaderComponent={() => (
          <>
            {renderSection('Idag', todayTasks)}
            {renderSection('Osorterat', inboxTasks)}
            {todayTasks.length === 0 && inboxTasks.length === 0 && (
              <Text style={styles.empty}>Inkorgen är tom</Text>
            )}
          </>
        )}
        renderItem={null}
        keyExtractor={() => 'header'}
      />
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 60,
    fontSize: 16,
  },
})

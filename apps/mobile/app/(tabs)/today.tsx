import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useTodayTasks, useTaskMutations } from '@todo/store'
import { useSupabase } from '../../src/context/SupabaseContext'
import { useAuthStore } from '@todo/store'
import TaskRow from '../../src/components/TaskRow'
import AddTaskFAB from '../../src/components/AddTaskFAB'

export default function TodayScreen() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''

  const { data: tasks = [], isLoading } = useTodayTasks(supabase, userId)
  const { complete } = useTaskMutations(supabase)

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {tasks.length === 0 ? (
        <Text style={styles.empty}>Inga uppgifter idag</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
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
  empty: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 60,
    fontSize: 16,
  },
})

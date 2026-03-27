import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Home, Settings, Bell, ChevronRight, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import React from 'react';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const showToast = () => {
    Toast.show({
      type: 'success',
      text1: 'Hello Siddharth!',
      text2: 'This is a beautiful toast notification 👋',
    });
  };

  return (
    <ScrollView 
      className="flex-1 bg-neutral-50"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }}
    >
      {/* Header */}
      <View className="px-6 pt-6 pb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-gray-500 font-medium">Good morning,</Text>
          <Text className="text-3xl font-bold text-gray-900 mt-1">IITRAM App</Text>
        </View>
        <TouchableOpacity 
          className="p-3 bg-white rounded-full shadow-sm border border-gray-100"
          onPress={showToast}
        >
          <Bell size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Featured Card */}
      <View className="mx-6 mt-4 p-6 bg-indigo-600 rounded-3xl shadow-md">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-white/80 font-medium mb-1">Campus Status</Text>
            <Text className="text-white text-3xl font-extrabold mb-4">All Systems Go</Text>
            <TouchableOpacity className="bg-white/20 self-start px-4 py-2 rounded-full flex-row items-center">
              <Sparkles size={16} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">View Announcements</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 mt-8">
        <Text className="text-xl font-bold text-gray-900 mb-4">Quick Actions</Text>
        <View className="flex-row justify-between">
          <ActionItem icon={<Home size={28} color="#4F46E5" />} title="Home" />
          <ActionItem icon={<Settings size={28} color="#4F46E5" />} title="Settings" />
          <ActionItem icon={<Bell size={28} color="#4F46E5" />} title="Alerts" />
          <ActionItem icon={<ChevronRight size={28} color="#4F46E5" />} title="More" />
        </View>
      </View>

      {/* Recent Activity */}
      <View className="px-6 mt-8 space-y-4">
        <Text className="text-xl font-bold text-gray-900 mb-2">Recent Activity</Text>
        {['Semester Registration', 'Library Book Due', 'Exam Schedule Released'].map((item, index) => (
          <View key={index} className="flex-row items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-3">
            <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center mr-4">
              <Sparkles size={20} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold">{item}</Text>
              <Text className="text-gray-500 text-sm mt-1">Today</Text>
            </View>
            <TouchableOpacity>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ActionItem({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <TouchableOpacity className="items-center">
      <View className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 items-center justify-center mb-2">
        {icon}
      </View>
      <Text className="text-gray-600 font-medium">{title}</Text>
    </TouchableOpacity>
  );
}

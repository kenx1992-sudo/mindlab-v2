'use client';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import Home from '@/views/Home';
import Book from '@/views/Book';
import Companion from '@/views/Companion';
import Records from '@/views/Records';
import Profile from '@/views/Profile';
import Subscription from '@/views/Subscription';
import Help from '@/views/Help';
import ThemePicker from '@/views/ThemePicker';
import NotificationSettings from '@/views/NotificationSettings';
import MoodJournal from '@/views/MoodJournal';
import Guardian from '@/views/Guardian';
import Legal from '@/views/Legal';
import PageNotFound from '@/lib/PageNotFound';

export default function AppShell() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-9 h-9 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/sessions" element={<Companion />} />
          <Route path="/help" element={<Help />} />
          <Route path="/records" element={<Records />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/themes" element={<ThemePicker />} />
          <Route path="/notifications" element={<NotificationSettings />} />
          <Route path="/mood-journal" element={<MoodJournal />} />
          <Route path="/guardian" element={<Guardian />} />
          <Route path="/legal/:doc" element={<Legal />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
}


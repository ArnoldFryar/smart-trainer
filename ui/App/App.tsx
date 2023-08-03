import { Show } from 'solid-js';
import Trainer from '../../services/device/index.js';
import { AppShell } from "../_common/AppShell/AppShell";

import { lazy } from "solid-js";
import { Routes, Route, Router, Navigate, hashIntegration } from "@solidjs/router";

const Activity = lazy(() => import("../Activity/Activity.js"));
const Manual = lazy(() => import("../Manual/Manual.js"));
const Settings = lazy(() => import("../Settings/Settings.js"));
const Workout = lazy(() => import("../Workout/Workout.js"));
const AnalyzeSet = lazy(() => import("../AnalyzeSet/AnalyzeSet.js"));

export function App() {
  return (
    <Router source={hashIntegration()}>
      <Routes>
        <Route path="/" component={AppShell}>
          <Route path="/" component={() => <Navigate href="/activity" />} />
          <Route path="/activity" component={Activity}/>
          <Route path="/performance" component={() => <div>Performance</div>}/>
          <Route path="/manual" component={Manual}/>
          <Route path="/learn" component={() => <div>Learn</div>}/>
          <Route path="/settings" component={Settings}/>
        </Route>
        <Route path="/workout" component={Workout}/>
        <Route path="/set/:setId" component={AnalyzeSet}/>
      </Routes>
      <Debug />
    </Router>
  );
}

function Debug() {
  return (
    <Show when={Trainer.connected()}>
      <div class="bg-black text-white opacity-20 absolute bottom-4 right-4 text-xs p-4 pointer-events-none">
        <div>Mode</div>
        <pre>{JSON.stringify(Trainer.mode(), null, 2)}</pre>
        <div>Sample</div>
        <pre>{JSON.stringify(Trainer.sample(), null, 2)}</pre>
        <div>Reps</div>
        <pre>{JSON.stringify(Trainer.reps(), null, 2)}</pre>
      </div>
    </Show>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Button, Heading, Inline, Select, SectionMessage, Spinner, Stack, Text, Toggle,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { SeverityTag, wcagLabel } from './shared.jsx';

const LEVELS = [
  { label: 'WCAG 2.2 level A', value: 'A' },
  { label: 'WCAG 2.2 level AA (recommended)', value: 'AA' },
  { label: 'WCAG 2.2 level AAA', value: 'AAA' },
];

const App = () => {
  const [settings, setSettings] = useState(null);
  const [rules, setRules] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, r] = await Promise.all([invoke('getSettings'), invoke('rules')]);
      setSettings(s);
      setRules(r);
    })();
  }, []);

  const save = useCallback(async (next) => {
    setSettings(next);
    setSaved(false);
    await invoke('saveSettings', { settings: next });
    setSaved(true);
  }, []);

  if (!settings) return <Inline space="space.100" alignBlock="center"><Spinner /><Text>Loading…</Text></Inline>;

  const disabled = new Set(settings.disabledRules ?? []);

  return (
    <Stack space="space.300">
      <Heading as="h1">Accessibility settings</Heading>
      {saved ? <SectionMessage appearance="success"><Text>Saved.</Text></SectionMessage> : null}

      <Stack space="space.100">
        <Heading as="h3">Conformance target</Heading>
        <Text appearance="subtle">Checks above this level are reported as advisory only.</Text>
        <Select
          options={LEVELS}
          value={LEVELS.find((l) => l.value === settings.targetLevel)}
          onChange={(opt) => save({ ...settings, targetLevel: opt.value })}
        />
      </Stack>

      <Stack space="space.100">
        <Heading as="h3">Checks</Heading>
        <Text appearance="subtle">Turn off a check to exclude it from scores and reports across the site.</Text>
        {rules.map((rule) => (
          <Inline key={rule.id} space="space.100" alignBlock="center" spread="space-between">
            <Stack space="space.025">
              <Inline space="space.100" alignBlock="center">
                <Toggle
                  isChecked={!disabled.has(rule.id)}
                  onChange={() => {
                    const next = new Set(disabled);
                    if (next.has(rule.id)) next.delete(rule.id);
                    else next.add(rule.id);
                    save({ ...settings, disabledRules: [...next] });
                  }}
                />
                <Text weight="bold">{rule.title}</Text>
                <SeverityTag severity={rule.severity} />
              </Inline>
              <Text appearance="subtle">{wcagLabel(rule.wcag)}</Text>
            </Stack>
          </Inline>
        ))}
      </Stack>
    </Stack>
  );
};

ForgeReconciler.render(<React.StrictMode><App /></React.StrictMode>);

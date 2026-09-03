import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Box, Button, ButtonGroup, Heading, Inline, Lozenge, SectionMessage, Spinner, Stack, Text,
  Textfield, Tabs, Tab, TabList, TabPanel, useProductContext,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { ScoreBadge, CountsRow, SeverityTag, SEVERITY_ORDER, wcagLabel } from './shared.jsx';

function IssueRow({ issue, rule, onFixAlt, busy }) {
  const [alt, setAlt] = useState('');
  const [saved, setSaved] = useState(false);
  const canFix = issue.ruleId === 'img-alt-missing' || issue.ruleId === 'img-alt-meaningless';

  return (
    <Box padding="space.100">
      <Stack space="space.075">
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <SeverityTag severity={issue.severity} />
          <Text weight="bold">{rule?.title ?? issue.ruleId}</Text>
          {issue.confidence === 'review' ? <Lozenge appearance="default">Needs review</Lozenge> : null}
        </Inline>
        {issue.evidence ? <Text appearance="subtle">{`“${issue.evidence}”`}</Text> : null}
        <Text>{rule?.why}</Text>
        <Text appearance="subtle">{`Fix: ${rule?.howToFix ?? ''}`}</Text>
        <Text appearance="subtle">{wcagLabel(rule?.wcag)}</Text>
        {issue.data?.ratio ? (
          <Text appearance="subtle">
            {`Measured ${issue.data.ratio}:1, needs ${issue.data.required}:1 (${issue.data.foreground} on ${issue.data.background})`}
          </Text>
        ) : null}
        {canFix && !saved ? (
          <Inline space="space.100" alignBlock="center">
            <Textfield
              placeholder="Describe what the image shows"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
            <Button
              appearance="primary"
              isDisabled={busy || alt.trim().length < 3}
              onClick={async () => {
                await onFixAlt(issue, alt.trim());
                setSaved(true);
              }}
            >
              Add alt text
            </Button>
          </Inline>
        ) : null}
        {saved ? <Lozenge appearance="success">Saved to the page</Lozenge> : null}
      </Stack>
    </Box>
  );
}

const App = () => {
  const context = useProductContext();
  const [state, setState] = useState({ loading: true });
  const [rules, setRules] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setState({ loading: true });
    setError(null);
    try {
      const [result, ruleList] = await Promise.all([invoke('scanCurrentPage'), invoke('rules')]);
      setRules(Object.fromEntries(ruleList.map((r) => [r.id, r])));
      setState({ loading: false, ...result });
    } catch (err) {
      setError(String(err?.message ?? err));
      setState({ loading: false });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const groups = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, []]));
    for (const issue of state.issues ?? []) groups[issue.severity]?.push(issue);
    return groups;
  }, [state.issues]);

  const fixAlt = useCallback(async (issue, alt) => {
    setBusy(true);
    try {
      await invoke('applyAltText', { path: issue.path, alt });
    } catch (err) {
      setError(String(err?.message ?? err));
    } finally {
      setBusy(false);
    }
  }, []);

  if (state.loading) return <Inline space="space.100" alignBlock="center"><Spinner /><Text>Checking this page…</Text></Inline>;

  if (error) {
    return (
      <SectionMessage appearance="error" title="The check could not finish">
        <Text>{error}</Text>
        <Button onClick={load}>Try again</Button>
      </SectionMessage>
    );
  }

  if (state.unsupported) {
    return <SectionMessage appearance="warning" title="This page cannot be checked automatically">
      <Text>Its body is stored in a format the checker cannot read, or it is larger than the limit.</Text>
    </SectionMessage>;
  }

  const summary = state.summary ?? {};
  const total = state.issues?.length ?? 0;

  return (
    <Stack space="space.200">
      <Inline space="space.200" alignBlock="center" spread="space-between">
        <ScoreBadge score={summary.score ?? 100} conformant={summary.conformant} />
        <Button onClick={load} isDisabled={busy}>Re-check</Button>
      </Inline>
      <CountsRow counts={summary.counts} />

      {total === 0 ? (
        <SectionMessage appearance="success" title="No accessibility issues found">
          <Text>Automated checks cannot confirm every WCAG criterion — a person still needs to review meaning, reading order and media alternatives.</Text>
        </SectionMessage>
      ) : (
        <Tabs id="a11y-issues">
          <TabList>
            <Tab>{`Issues (${total})`}</Tab>
            <Tab>{`WCAG criteria (${state.criteria?.length ?? 0})`}</Tab>
          </TabList>
          <TabPanel>
            <Stack space="space.100">
              {SEVERITY_ORDER.filter((s) => grouped[s].length).map((s) => (
                <Stack key={s} space="space.050">
                  <Heading as="h4">{`${grouped[s].length} ${s}`}</Heading>
                  {grouped[s].map((issue, idx) => (
                    <IssueRow
                      key={`${issue.ruleId}-${idx}`}
                      issue={issue}
                      rule={rules[issue.ruleId]}
                      onFixAlt={fixAlt}
                      busy={busy}
                    />
                  ))}
                </Stack>
              ))}
            </Stack>
          </TabPanel>
          <TabPanel>
            <Stack space="space.050">
              {(state.criteria ?? []).map((c) => (
                <Inline key={c.criterion} space="space.100" alignBlock="center">
                  <Lozenge appearance={c.status === 'fail' ? 'removed' : c.status === 'review' ? 'moved' : c.status === 'pass' ? 'success' : 'default'}>
                    {c.status}
                  </Lozenge>
                  <Text>{`${c.criterion} ${c.name} (${c.level})`}</Text>
                  {c.issueCount ? <Text appearance="subtle">{`${c.issueCount} issues`}</Text> : null}
                </Inline>
              ))}
            </Stack>
          </TabPanel>
        </Tabs>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

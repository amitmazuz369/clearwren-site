import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  DynamicTable, Heading, Inline, Lozenge, SectionMessage, Spinner, Stack, Text,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { CountsRow, scoreAppearance } from './shared.jsx';

const App = () => {
  const [data, setData] = useState({ loading: true });

  const load = useCallback(async () => {
    const res = await invoke('siteReport');
    setData({ loading: false, ...res });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (data.loading) return <Inline space="space.100" alignBlock="center"><Spinner /><Text>Loading…</Text></Inline>;

  if (!data.spaces?.length) {
    return (
      <SectionMessage appearance="information" title="Nothing scanned yet">
        <Text>Open a space, choose Accessibility in the space menu and run a scan. Results roll up here.</Text>
      </SectionMessage>
    );
  }

  return (
    <Stack space="space.300">
      <Heading as="h1">Accessibility across this site</Heading>
      <Inline space="space.300" shouldWrap>
        <Stack space="space.050">
          <Text appearance="subtle">Pages checked</Text>
          <Heading as="h2">{String(data.totals.pages)}</Heading>
        </Stack>
        <Stack space="space.050">
          <Text appearance="subtle">Pages with no A/AA failure</Text>
          <Heading as="h2">{`${data.totals.conformantPages} of ${data.totals.pages}`}</Heading>
        </Stack>
        <Stack space="space.050">
          <Text appearance="subtle">Average score</Text>
          <Heading as="h2">{`${data.totals.averageScore}/100`}</Heading>
        </Stack>
      </Inline>
      <CountsRow counts={data.totals.counts} />
      <DynamicTable
        head={{ cells: [
          { key: 'space', content: 'Space' },
          { key: 'score', content: 'Average score' },
          { key: 'pages', content: 'Pages' },
          { key: 'ok', content: 'Passing' },
          { key: 'critical', content: 'Critical' },
        ] }}
        rows={data.spaces.map((s) => ({
          key: s.spaceKey,
          cells: [
            { key: 'space', content: <Text>{s.spaceKey}</Text> },
            { key: 'score', content: <Lozenge appearance={scoreAppearance(s.averageScore)}>{String(s.averageScore)}</Lozenge> },
            { key: 'pages', content: <Text>{String(s.pages)}</Text> },
            { key: 'ok', content: <Text>{String(s.conformantPages)}</Text> },
            { key: 'critical', content: <Text>{String(s.counts?.critical ?? 0)}</Text> },
          ],
        }))}
        rowsPerPage={20}
      />
    </Stack>
  );
};

ForgeReconciler.render(<React.StrictMode><App /></React.StrictMode>);

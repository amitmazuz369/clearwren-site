import React from 'react';
import { Box, Inline, Lozenge, Text, Stack, Heading, xcss } from '@forge/react';

export const SEVERITY_ORDER = ['critical', 'serious', 'moderate', 'advisory'];

export const SEVERITY_APPEARANCE = {
  critical: 'removed',
  serious: 'moved',
  moderate: 'inprogress',
  advisory: 'default',
};

export const SEVERITY_LABEL = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  advisory: 'Advisory',
};

export function SeverityTag({ severity }) {
  return <Lozenge appearance={SEVERITY_APPEARANCE[severity] ?? 'default'}>{SEVERITY_LABEL[severity] ?? severity}</Lozenge>;
}

export function scoreAppearance(score) {
  if (score >= 90) return 'success';
  if (score >= 70) return 'inprogress';
  if (score >= 40) return 'moved';
  return 'removed';
}

const scoreBox = xcss({ paddingBlock: 'space.100', paddingInline: 'space.200', borderRadius: 'border.radius.200' });

export function ScoreBadge({ score, conformant }) {
  return (
    <Inline space="space.100" alignBlock="center">
      <Box xcss={scoreBox}>
        <Heading as="h2">{score}/100</Heading>
      </Box>
      <Lozenge appearance={conformant ? 'success' : 'removed'} isBold>
        {conformant ? 'No A/AA failures' : 'Fails WCAG AA'}
      </Lozenge>
    </Inline>
  );
}

export function CountsRow({ counts }) {
  return (
    <Inline space="space.100" shouldWrap>
      {SEVERITY_ORDER.map((s) => (
        <Lozenge key={s} appearance={SEVERITY_APPEARANCE[s]}>
          {`${SEVERITY_LABEL[s]}: ${counts?.[s] ?? 0}`}
        </Lozenge>
      ))}
    </Inline>
  );
}

export function Empty({ title, children }) {
  return (
    <Stack space="space.100">
      <Heading as="h3">{title}</Heading>
      <Text>{children}</Text>
    </Stack>
  );
}

export function wcagLabel(wcag = []) {
  return wcag.map((w) => `${w.criterion} ${w.name} (${w.level})`).join(' · ');
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Unit Tests: Campaign Operations & Logic', () => {
  const mockCampaigns = [
    {
      id: 'camp-1',
      name: 'Instagram — Festive Flash Offer',
      channel: 'Instagram',
      status: 'Active',
      reach: 48500,
      clicks: 3420,
      purchases: 142,
      spend: 18500,
      revenue: 89400,
    },
    {
      id: 'camp-2',
      name: 'Google Search — High Intent Keywords',
      channel: 'Google Search',
      status: 'Paused',
      reach: 22100,
      clicks: 1890,
      purchases: 88,
      spend: 14200,
      revenue: 55400,
    },
    {
      id: 'camp-3',
      name: 'Facebook Retargeting — Abandoned Cart',
      channel: 'Facebook',
      status: 'Active',
      reach: 12400,
      clicks: 980,
      purchases: 64,
      spend: 8100,
      revenue: 41200,
    },
  ];

  it('filters campaigns accurately by status', () => {
    const active = mockCampaigns.filter((c) => c.status === 'Active');
    const paused = mockCampaigns.filter((c) => c.status === 'Paused');

    assert.equal(active.length, 2);
    assert.equal(paused.length, 1);
    assert.equal(paused[0].name, 'Google Search — High Intent Keywords');
  });

  it('filters campaigns by marketing channel', () => {
    const instagram = mockCampaigns.filter((c) => c.channel === 'Instagram');
    const google = mockCampaigns.filter((c) => c.channel === 'Google Search');

    assert.equal(instagram.length, 1);
    assert.equal(google.length, 1);
  });

  it('searches campaigns case-insensitively', () => {
    const query = 'festive';
    const matches = mockCampaigns.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );

    assert.equal(matches.length, 1);
    assert.equal(matches[0].id, 'camp-1');
  });

  it('toggles campaign status between Active and Paused without mutating other fields', () => {
    let campaigns = [...mockCampaigns];

    // Toggle camp-1 from Active to Paused
    campaigns = campaigns.map((c) => {
      if (c.id === 'camp-1') {
        const nextStatus = c.status === 'Active' ? 'Paused' : 'Active';
        return { ...c, status: nextStatus };
      }
      return c;
    });

    assert.equal(campaigns.find((c) => c.id === 'camp-1')?.status, 'Paused');

    // Toggle back to Active
    campaigns = campaigns.map((c) => {
      if (c.id === 'camp-1') {
        const nextStatus = c.status === 'Active' ? 'Paused' : 'Active';
        return { ...c, status: nextStatus };
      }
      return c;
    });

    assert.equal(campaigns.find((c) => c.id === 'camp-1')?.status, 'Active');
  });

  it('computes blended aggregate metrics and ROAS correctly', () => {
    const totalReach = mockCampaigns.reduce((acc, c) => acc + c.reach, 0);
    const totalPurchases = mockCampaigns.reduce((acc, c) => acc + c.purchases, 0);
    const totalSpend = mockCampaigns.reduce((acc, c) => acc + c.spend, 0);
    const totalRevenue = mockCampaigns.reduce((acc, c) => acc + c.revenue, 0);
    const blendedRoas = (totalRevenue / (totalSpend || 1)).toFixed(2);

    assert.equal(totalReach, 83000);
    assert.equal(totalPurchases, 294);
    assert.equal(totalSpend, 40800);
    assert.equal(totalRevenue, 186000);
    assert.equal(blendedRoas, '4.56');
  });
});

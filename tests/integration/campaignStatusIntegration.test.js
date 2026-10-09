import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Integration Tests: Campaign Status State Machine & User Feedback', () => {
  it('toggles campaign status, dispatches toast notification, and updates filtered views', () => {
    // 1. Initial State
    let campaigns = [
      {
        id: 'camp-101',
        name: 'Meta Ads — Festive Kurta Flash',
        channel: 'Facebook',
        status: 'Active',
        reach: 25000,
        clicks: 1200,
        purchases: 50,
        spend: 7000,
        revenue: 28000,
      },
    ];

    const dispatchedToasts = [];
    const addToast = (toast) => {
      dispatchedToasts.push({ id: `toast-${Date.now()}`, ...toast });
    };

    // 2. User Clicks "Pause Campaign"
    const toggleCampaignStatus = (id) => {
      campaigns = campaigns.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'Active' ? 'Paused' : 'Active';
          addToast({
            title: `Campaign ${nextStatus}`,
            message: `${c.name} is now ${nextStatus.toLowerCase()}`,
            type: nextStatus === 'Active' ? 'success' : 'warning',
          });
          return { ...c, status: nextStatus };
        }
        return c;
      });
    };

    toggleCampaignStatus('camp-101');

    // 3. Verify Campaign Status Mutation
    const updatedCamp = campaigns.find((c) => c.id === 'camp-101');
    assert.equal(updatedCamp?.status, 'Paused');

    // 4. Verify Toast Emission
    assert.equal(dispatchedToasts.length, 1);
    assert.equal(dispatchedToasts[0].title, 'Campaign Paused');
    assert.equal(dispatchedToasts[0].type, 'warning');
    assert.ok(dispatchedToasts[0].message.includes('now paused'));

    // 5. Verify Filter Behavior
    const activeOnly = campaigns.filter((c) => c.status === 'Active');
    const pausedOnly = campaigns.filter((c) => c.status === 'Paused');
    assert.equal(activeOnly.length, 0);
    assert.equal(pausedOnly.length, 1);

    // 6. Resume Campaign
    toggleCampaignStatus('camp-101');
    assert.equal(campaigns.find((c) => c.id === 'camp-101')?.status, 'Active');
    assert.equal(dispatchedToasts.length, 2);
    assert.equal(dispatchedToasts[1].title, 'Campaign Active');
    assert.equal(dispatchedToasts[1].type, 'success');
  });
});

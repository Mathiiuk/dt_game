const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qozozdaavjfxvssvxqbx.supabase.co';
const supabaseAnonKey = 'sb_publishable_VtNbVt-LP7mmU-vQPA5v7w_DORDJBC7';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
  console.log('--- TEST UPDATE VIA ANON CLIENT ---');
  
  // Test reading a club
  const { data: club, error: readClubErr } = await supabase.from('clubs').select('id, name, budget').limit(1).single();
  console.log('Read club:', club?.name, readClubErr || 'OK');

  if (club) {
    // Try updating club (same budget)
    const { data: updatedClub, error: updateClubErr } = await supabase
      .from('clubs')
      .update({ budget: club.budget })
      .eq('id', club.id)
      .select();
    console.log('Update club result count:', updatedClub?.length, 'Error:', updateClubErr?.message || 'None');
  }

  // Test reading a player
  const { data: player, error: readPlayerErr } = await supabase.from('players').select('id, first_name, last_name, is_transfer_listed').limit(1).single();
  console.log('Read player:', player?.last_name, readPlayerErr || 'OK');

  if (player) {
    // Try updating player
    const { data: updatedPlayer, error: updatePlayerErr } = await supabase
      .from('players')
      .update({ is_transfer_listed: player.is_transfer_listed })
      .eq('id', player.id)
      .select();
    console.log('Update player result count:', updatedPlayer?.length, 'Error:', updatePlayerErr?.message || 'None');
  }
}

testUpdate().catch(console.error);

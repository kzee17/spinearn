import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { user_email, ip_address, device_info } = await req.json();

    if (!user_email) {
      return NextResponse.json({ error: 'Missing user_email' }, { status: 400 });
    }

    let fraudScore = 0;
    const flags: string[] = [];

    const today = new Date().toISOString().split('T')[0];

    const { data: todayTasks } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_email', user_email)
      .gte('created_at', today);

    if ((todayTasks?.length || 0) >= 10) {
      fraudScore += 30;
      flags.push('daily_limit_pressure');
    }

    if (ip_address) {
      const { data: ipTasks } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('ip_address', ip_address)
        .gte('created_at', today);

      if ((ipTasks?.length || 0) >= 15) {
        fraudScore += 35;
        flags.push('high_same_ip_activity');
      }
    }

    if (device_info) {
      const { data: deviceTasks } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('device_info', device_info)
        .gte('created_at', today);

      if ((deviceTasks?.length || 0) >= 15) {
        fraudScore += 35;
        flags.push('high_same_device_activity');
      }
    }

    const { data: rejectedProofs } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_email', user_email)
      .eq('proof_status', 'rejected');

    if ((rejectedProofs?.length || 0) >= 3) {
      fraudScore += 40;
      flags.push('multiple_rejected_proofs');
    }

    let fraudStatus = 'clear';

    if (fraudScore >= 70) fraudStatus = 'blocked';
    else if (fraudScore >= 40) fraudStatus = 'review';

    await supabase
      .from('waitlist_users')
      .update({
        fraud_score: fraudScore,
        fraud_status: fraudStatus,
      })
      .eq('email', user_email);

    return NextResponse.json({
      fraud_score: fraudScore,
      fraud_status: fraudStatus,
      fraud_flags: flags,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Fraud check failed' },
      { status: 500 }
    );
  }
}
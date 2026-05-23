// server.js - Versi Supabase Database (READY FOR DEPLOY)
const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============ SUPABASE CONFIGURATION ============
const supabaseUrl = 'https://duuaemjcsanuoltmvxlv.supabase.co';
const supabaseKey = 'sb_publishable_Zk9PfDvYkZgHfNPKph4ahg_A3IDw6Xt';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============ API ENDPOINTS ============

// GET all services
app.get('/api/services', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('id');
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE service
app.put('/api/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, icon } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Nama dan harga harus diisi' });
        }
        
        const { error } = await supabase
            .from('services')
            .update({ name, description, price: parseInt(price), icon })
            .eq('id', parseInt(id));
        
        if (error) throw error;
        
        console.log(`✅ Service ${id} updated`);
        res.json({ success: true, message: 'Layanan berhasil diperbarui' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE service
app.delete('/api/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', parseInt(id));
        
        if (error) throw error;
        
        console.log(`✅ Service ${id} deleted`);
        res.json({ success: true, message: 'Layanan berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// CREATE booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { name, phone, service, date, time, message } = req.body;
        
        const { data, error } = await supabase
            .from('bookings')
            .insert([{
                name, phone, service, date, time,
                message: message || '',
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        
        console.log(`✅ Booking: ${name}`);
        res.json({ success: true, id: data[0].id });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', parseInt(id));
        
        if (error) throw error;
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET admin data
app.get('/admin/data', async (req, res) => {
    try {
        const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        const { data: services } = await supabase.from('services').select('*').order('id');
        
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings?.filter(b => b.date === today).length || 0;
        
        let totalRevenue = 0;
        bookings?.forEach(booking => {
            const match = booking.service.match(/Rp\s([\d.,]+)/);
            if (match) totalRevenue += parseInt(match[1].replace(/\./g, ''));
        });
        
        res.json({
            statistics: {
                total_bookings: bookings?.length || 0,
                total_services: services?.length || 0,
                today_bookings: todayBookings,
                total_revenue: totalRevenue
            },
            services: services || [],
            bookings: bookings || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin.html`);
});

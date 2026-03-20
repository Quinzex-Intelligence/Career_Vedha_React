const testSearch = async () => {
    try {
        const response1 = await fetch('http://localhost:8000/api/cms/articles/?q=guest&limit=200'); // Assuming backend is at 8000
        const data1 = await response1.json();
        console.log('Articles:', data1.results ? data1.results.length : data1.length);
        
        const response2 = await fetch('http://localhost:8000/api/jobs/');
        const data2 = await response2.json();
        const jobs = data2.results || data2;
        console.log('Jobs total:', jobs.length);
        const guestJobs = (jobs || []).filter(j => JSON.stringify(j).toLowerCase().includes('guest'));
        console.log('Guest jobs:', guestJobs.length);
    } catch (e) {
        console.error(e.message);
    }
};
testSearch();

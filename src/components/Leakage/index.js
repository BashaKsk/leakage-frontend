import React, { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Button, CircularProgress, TextField } from '@mui/material';
import TablePagination from '@mui/material/TablePagination';
import { useFieldArray, useForm } from 'react-hook-form';

const skuMapper = {
    "1": "tm_1000",
    "2": "tm_500",
    "3": "tm_160",
    "4": "dtm_900",
    "5": "dtm_150",
    "6": "std_400",
    "11": "tm_120"
};

export default function LeakageTable() {
    const { register, control, setValue, watch } = useForm({
        defaultValues: {
            leakageData: [],
        }
    });

    const { fields: leakageData } = useFieldArray({ name: 'leakageData', control });

    const [page, setPage] = useState(0);
    const [count, setCount] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [activeButton, setActiveButton] = useState('today');

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const buttonStyle = (button) => ({
        textDecoration: activeButton === button ? 'underline' : 'none',
        cursor: 'pointer',
        margin: '0 10px',
    });

    const fetchLeakingData = (type = null) => {
        setIsLoading(true);

        fetch(`http://localhost:3000/data?type=${type}&page=${page}&limit=${rowsPerPage}`)
            .then(response => response.json())
            .then(res => {
                setValue('leakageData', res.data);
                setCount(res.totalCount);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    };

    const handleClick = (button) => {
        setActiveButton(button);
        setPage(0);
        fetchLeakingData(button);
    };

    useEffect(() => {
        fetchLeakingData(activeButton);
    }, [activeButton, page, rowsPerPage]);

    const getSkuName = (row) => {
        const countMEndsV = Object.keys(row).filter(key => key.startsWith('M') && key.endsWith('V')).length;
        return skuMapper[countMEndsV] || 'No Sku';
    };

    const getTotalCount = (row) => {
        const keysMEndsV = Object.keys(row).filter(key => key.startsWith('M') && key.endsWith('V'));
        const lastMEndsVKey = keysMEndsV[keysMEndsV.length - 1];
        return row[lastMEndsVKey];
    };

    const watchedFields = watch('leakageData');
    const startIndex = page * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, leakageData.length);
    const currentPageData = leakageData.slice(startIndex, endIndex);

    const handleSubmit = async (index) => {

        setIsLoading(true);

        const obj = watchedFields[index];

        return fetch(`http://localhost:3000/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(obj),
        })
            .then((res) => res.json())
            .catch((err) => console.error(err))
            .finally(() => {

                setPage(0);
                fetchLeakingData('saved');
                setActiveButton('saved');
            });
    };

    return (
        <Box sx={{ padding: 5 }}>
            <Box sx={{ display: 'flex', padding: 5, justifyContent: 'space-between' }}>
                <h2>Leakage Form</h2>
                <Box sx={{ display: 'flex', gap: 5 }}>
                    <Button size='small' sx={buttonStyle('today')} onClick={() => handleClick('today')}>
                        Today's
                    </Button>
                    <Button size='small' sx={buttonStyle('pending')} onClick={() => handleClick('pending')}>
                        Pending
                    </Button>
                    <Button size='small' sx={buttonStyle('saved')} onClick={() => handleClick('saved')}>
                        Saved
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">SKU Name</TableCell>
                            <TableCell align="right">Reject Count</TableCell>
                            <TableCell align="center">Actual Count</TableCell>
                            <TableCell align="right">Total Count</TableCell>
                            <TableCell align="right">Operations</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            currentPageData.map((row, index) => (
                                <TableRow
                                    key={row.name}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {row.DATE_TIME}
                                    </TableCell>
                                    <TableCell align="right">{getSkuName(row)}</TableCell>
                                    <TableCell align="right">
                                        {`${getTotalCount(row)}-${row?.actualCount ?? 0}`}
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            size='small'
                                            defaultValue={row?.actualCount}
                                            placeholder='Enter Value'
                                            {...register(`leakageData[${index}].actualCount`)}
                                        />
                                    </TableCell>
                                    <TableCell align="right">{getTotalCount(row)}</TableCell>
                                    <TableCell align="right">
                                        {activeButton === 'today' ? (
                                            <Button variant="contained" onClick={() => handleSubmit(index)}>Submit</Button>
                                        ) : (
                                            <Button variant="contained">Edit</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={count}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 20, 30]}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Box>
    );
}

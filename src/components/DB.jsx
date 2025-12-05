// src/App.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import initSqlJs from "sql.js";
import { GlobalContext } from "./GlobalContext";
import { FaPlay, FaEye, FaEyeSlash } from "react-icons/fa";
import { Container, Row, Col, Card, Form, Button, Table, Alert, Badge, Spinner, Carousel } from "react-bootstrap";

function DB(props) {
    const [db, setDb] = useState(null);
    const { appSettings, I18n } = useContext(GlobalContext);
    const [loadingDb, setLoadingDb] = useState(true);
    const [query, setQuery] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [testsStatus, setTestsStatus] = useState([]);

    const [showImagesPanel, setShowImagesPanel] = useState(true);
    const [imagesPanelWidth, setImagesPanelWidth] = useState("50%"); // px
    const [isResizing, setIsResizing] = useState(false);
  
    useEffect(() => {
        setQuery(appSettings.initialQuery);
        const loadDb = async () => {
        if (!appSettings || !appSettings.dbUrl) {
            setLoadingDb(false);
            return;
        }

        try {
            setLoadingDb(true);
            const SQL = await initSqlJs({
            locateFile: (file) => `https://sql.js.org/dist/${file}`,
            });

            const dbRes = await fetch(appSettings.dbUrl);
            if (!dbRes.ok) {
                throw new Error(`${I18n.getTrans("i.error_fetching_db")} ${appSettings.dbUrl}`);
            }

            const buffer = await dbRes.arrayBuffer();
            const database = new SQL.Database(new Uint8Array(buffer));
            setDb(database);
        } catch (err) {
            console.error(err);
            setError(err.message || I18n.getTrans("i.error_loading_db"));
        } finally {
            setLoadingDb(false);
        }
        };

        loadDb();
    }, [appSettings]);

    const tests = useMemo(
        () => (appSettings && Array.isArray(appSettings.tests) ? appSettings.tests : null),
        [appSettings]
    );

    const images = useMemo(
        () => (appSettings && Array.isArray(appSettings.images) ? appSettings.images : []),
        [appSettings]
    );

    const runTests = (currentQuery, columns, rows) => {
        const context = { query: currentQuery, columns, rows };

        const newStatus = tests ? tests.map((t) => {
        try {
            // eslint-disable-next-line no-new-func
            const testFn = new Function(`return (({query,columns,rows})=>{${t.fn});}`)();
            const passed = !!testFn(context);
            return { id: t.id || t.description, description: t.description || t.id, passed, error: null};
        } catch (err) {
            console.error("Error in test", t.id, err);
            return { id: t.id || t.description, description: t.description || t.id, passed: false, error: err.message };
        }
        }) : [];

        setTestsStatus(newStatus);
        const res = newStatus.map(t => t.passed ? 1:0);
        props.checkSolution(res.join(';') + (res.every(t => t == 1) ? '': ("|||"+query)));
        
    };

    const runQuery = () => {
        if (!db) return;
        setError("");
        setTestsStatus([]);

        try {
        const trimmed = query.trim();
        if (!trimmed) {
            setResult(null);
            return;
        }

        const res = db.exec(trimmed);

        if (!res || res.length === 0) {
            const empty = { columns: [], rows: [] };
            setResult(empty);
            runTests(trimmed, empty.columns, empty.rows);
            return;
        }

        const { columns, values } = res[0];
        const rows = values || [];
        const output = { columns, rows };
        setResult(output);
        runTests(trimmed, columns, rows);
        } catch (err) {
            console.error(err);
            setError(err.message || I18n.getTrans("i.error_running_query"));
            setResult(null);
            props.checkSolution(err.message + "|||" + query);
        
        }
    };

    const allTestsPassed =
        testsStatus.length > 0 &&
        testsStatus.every((t) => t.passed && !t.error);

    const isLoading = loadingDb;

    useEffect(() => {
        const handleMouseMove = (e) => {
        if (!isResizing) return;
        const minWidth = 100;
        const maxWidth = window.innerWidth - 100;
        const newWidth = Math.min(
            maxWidth,
            Math.max(minWidth, window.innerWidth - e.clientX)
        );
        setImagesPanelWidth(newWidth);
        };

        const handleMouseUp = () => {
        if (isResizing) {
            setIsResizing(false);
        }
        };

        if (isResizing) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing]);

    return (
        <Container fluid className="py-3">
        <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
            <div>
                {appSettings && appSettings.title && <h1 className="h3 mb-2">{appSettings.title}</h1>}
                {appSettings && appSettings.question && (
                <p className="text-muted mb-1">{appSettings.question}</p>
                )}
                {isLoading && (
                <div className="d-flex align-items-center gap-2 text-muted">
                    <Spinner animation="border" size="sm" />
                    <span>{I18n.getTrans("i.loading_config_and_db")}</span>
                </div>
                )}
            </div>
            {images.length > 0 && (
                <Button variant="outline-secondary" size="sm" onClick={() => setShowImagesPanel((v) => !v)}>
                {!showImagesPanel ? <span>Show&nbsp;<FaEye size={24}/></span> : <span>Hide&nbsp;<FaEyeSlash size={24}/></span>}
                </Button>
            )}
            </Col>
        </Row>

        {error && (
            <Row className="mb-3">
            <Col>
                <Alert variant="danger">
                <Alert.Heading className="h6">{I18n.getTrans("i.error")}</Alert.Heading>
                <p className="mb-0">{error}</p>
                </Alert>
            </Col>
            </Row>
        )}

        <Row>
            <Col>
            <div style={{ display: "flex"}}>
                <div style={{flex: 1, display: "flex", flexDirection: "column"}}>
                <Card className="border-bottom">
                    <Card.Header>
                    <Card.Title as="h2" className="h6 mb-0">
                        {appSettings.queryCardTitle || I18n.getTrans("i.Query")}
                    </Card.Title>
                    </Card.Header>
                    <Card.Body className="d-flex flex-column">
                    <Form.Group className="mb-2 flex-grow-1 d-flex flex-column">
                        <Form.Control as="textarea" data-enable-grammarly="false" rows={3} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={appSettings.queryPlaceholder || I18n.getTrans("i.write_sql_here")} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", flex: 1}} />
                    </Form.Group>
                    <div className="d-flex justify-content-end mt-0">
                        <Button variant="primary" onClick={runQuery} disabled={!db || isLoading}>
                           <span> {I18n.getTrans("i.run")}</span>&nbsp;<FaPlay size={16} />
                        </Button>
                    </div>
                    </Card.Body>
                </Card>

                <div className="d-flex flex-column flex-grow-1 mt-3">
                    <Card className=" border-bottom flex-grow-1">
                    <Card.Header>
                        <Card.Title as="h2" className="h6 mb-0">
                        {appSettings.resultsCardTitle || I18n.getTrans("i.Results")}
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>
                        {result && result.columns.length > 0 ? (
                        <div style={{ maxHeight: 260, overflowY: "auto" }}>
                            <Table striped bordered hover size="sm" className="mb-0" responsive >
                            <thead className="table-primary" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                <tr>
                                {result.columns.map((col) => (
                                    <th key={col}>{col}</th>
                                ))}
                                </tr>
                            </thead>
                            <tbody>
                                {result.rows.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => (
                                    <td key={j}>{String(cell)}</td>
                                    ))}
                                </tr>
                                ))}
                            </tbody>
                            </Table>
                        </div>
                        ) : (
                        <p className="text-muted mb-0">
                            {I18n.getTrans("i.RunQueryForResults")} 
                        </p>
                        )}
                    </Card.Body>
                    </Card>

                    {tests && (tests.length > 0) && <Card className="mt-3 flex-shrink-0">
                    <Card.Header>
                        <Card.Title as="h2" className="h6 mb-0">
                            {appSettings.testsCardTitle || I18n.getTrans("i.Tests")}
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>
                        
                        {testsStatus.length === 0 && (
                        <p className="text-muted mb-0">
                             {I18n.getTrans("i.tests_will_run_automatically")}
                        </p>
                        )}

                        {testsStatus.map((t) => (
                        <Alert key={t.id} variant={t.passed && !t.error ? "success" : "danger"} className="py-2">
                            <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <strong className="me-2">
                                {/* {t.passed && !t.error ? "Passed" : "Failed"} */}
                                </strong>
                                <span>{t.description}</span>
                                {t.error && (
                                <span className="ms-2 text-danger">
                                    ({t.error})
                                </span>
                                )}
                            </div>
                            <Badge
                                bg={t.passed && !t.error ? "success" : "danger"}>
                                {t.passed && !t.error ? "Pass" : "Fail"}
                            </Badge>
                            </div>
                        </Alert>
                        ))}

                        {allTestsPassed && (
                        <Alert variant="success" className="mt-2 mb-0 py-2">
                            {I18n.getTrans("i.all_tests_passed")}
                        </Alert>
                        )}
                    </Card.Body>
                    </Card>}
                </div>
                </div>

                {showImagesPanel && images.length > 0 && (
                <div style={{ width: "6px", cursor: "col-resize", background: "linear-gradient(to bottom, rgba(0,0,0,.05), rgba(0,0,0,.02))", }} onMouseDown={() => setIsResizing(true)}  />
                )}
                {showImagesPanel && images.length > 0 && (
                <div style={{  width: imagesPanelWidth, display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(0,0,0,.1)" }}>
                    <Card className="h-100 ">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title as="h2" className="h6 mb-0">
                                {appSettings.infoCardTitle || I18n.getTrans("i.Information")}
                            </Card.Title>
                                {images.length > 1  ? <Badge bg="secondary" pill id="badged"> {images.length} </Badge> : null}
                        </Card.Header>
                        <Card.Body className="p-0" style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#f8f9fa" }}>
                            {images.length === 1 ? (
                                <img src={images[0]} alt="Task" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain"}}/>
                            ) : (
                                <Carousel controls={images.length > 1} indicators={images.length > 1} interval={null} className="w-100 carousel-dark">
                                {images.map((url, idx) => (
                                    <Carousel.Item key={url || idx}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.75rem", background: "#f8f9fa" }}>
                                            <img src={url} alt={`Slide ${idx + 1}`} style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }} />
                                        </div>
                                    </Carousel.Item>
                                ))}
                                </Carousel>
                            )}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
                )}
            </div>
            </Col>
        </Row>
        </Container>
    );
}

export default DB;

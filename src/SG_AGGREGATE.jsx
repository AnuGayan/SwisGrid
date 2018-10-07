import React from 'react';
// import {MuiThemeProvider} from '@material-ui/core/styles';
import { createMuiTheme, MuiThemeProvider } from 'material-ui';
import _ from 'lodash';
import ReactTable from 'react-table';
import './resources/css/tableChart.css';
import { timeFormat } from 'd3-time-format';
import Widget from '@wso2-dashboards/widget';

class SG_AGGREGATE extends Widget {

    constructor(props) {
        console.log("constructor called");
        super(props);
        this.state = {
            id: props.id,
            width: props.glContainer.width,
            height: props.glContainer.height,
            dataSet: [],
        };

        this.handleResize = this.handleResize.bind(this);
        this.props.glContainer.on('resize', this.handleResize);
        this.handleData = this.handleData.bind(this);
        this.getNormalCellComponent = this.getNormalCellComponent.bind(this);
        this.setReceivedMsg = this.setReceivedMsg.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);

        this.tableConfig = [
            {
                Header: 'Service Name',
                accessor: 'service',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Number of successes',
                accessor: 'number_of_success_service',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Number of failures',
                accessor: 'number_of_failed_service',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Min File Size',
                accessor: 'min_file_size',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Max File Size',
                accessor: 'max_file_size',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Avg File Size',
                accessor: 'avg_file_size',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Min Duration',
                accessor: 'min_duration',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Max Duration',
                accessor: 'max_duration',
                Cell: this.getNormalCellComponent
            },
            {
                Header: 'Avg Duration',
                accessor: 'avg_duration',
                Cell: this.getNormalCellComponent
            }
        ];
    }

    getNormalCellComponent(props) {

        return (
            <div
                style={{
                    padding: 5,
                    fontSize: 14,
                    textAlign: 'left'
                }}
            >
                {
                    props.column.id === 'timestamp' ?
                        <span>{timeFormat('%m/%d/%Y, %I:%M:%S %p')(new Date(props.value))}</span> :
                        <span>{props.value}</span>
                }
            </div>
        );
    }

    componentWillMount() {
        console.log("componentWillMount called");

    }

    setReceivedMsg(receivedMessage) {
        console.log(receivedMessage.granularity);
        console.log(receivedMessage.from);
        console.log(receivedMessage.to);
        this.setState({
            per: receivedMessage.granularity,
            fromDate: receivedMessage.from,
            toDate: receivedMessage.to
        }, this.assembleQuery);
    }

    assembleQuery() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        let dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
        console.log(dataProviderConfigs);
        let query = dataProviderConfigs.configs.config.queryData.query;
        query = query
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate);
        dataProviderConfigs.configs.config.queryData.query = query;
        console.log(query);
        super.getWidgetChannelManager()
            .subscribeWidget(this.props.id, this.handleData, dataProviderConfigs);
    }

    componentDidMount() {
        console.log("componentDidMount called");
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                console.log(message);
                this.setState({
                    providerConfig: message.data.configs.providerConfig
                }, () => super.subscribe(this.setReceivedMsg));
            })
    }

    componentWillUnmount() {
        console.log("Unmount Called");
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    handleData(response) {
        let tmpArr = [];
        console.log("handleData called");
        console.log(response);
        response.data.forEach((datum) => {
            let obj = {};
            for (let i = 0; i < response.metadata.names.length; i++) {
                obj[response.metadata.names[i]] = datum[i];
            }
            tmpArr.push(obj);
        });
        this.setState((prevState) => {
            prevState.dataSet = tmpArr;
            return prevState;
        })
    }



    render() {
        let { dataSet, filterEndTime, filterStartTime } = this.state;

        let theme = createMuiTheme({
            palette: {
                type: this.props.muiTheme.name,
            },
        });

        return (
            <MuiThemeProvider theme={theme}>
                <div style={{ margin: '1% 2% 0 2%' }}>
                    <ReactTable
                        className={this.props.muiTheme.name === 'light' ? 'lightTheme' : 'darkTheme'}
                        columns={this.tableConfig}
                        data={
                            filterStartTime && filterEndTime ?
                                _.filter(dataSet,
                                    (d) => (d.starttime > filterStartTime.getTime() && d.starttime < filterEndTime.getTime())) :
                                dataSet
                        }
                        showPagination={false}
                        defaultSorted={[
                            {
                                id: 'timestamp',
                                desc: true,
                            }
                        ]}
                    />
                </div>
            </MuiThemeProvider>
        );
    }

    handleResize() {
        this.setState({ width: this.props.glContainer.width, height: this.props.glContainer.height });
    }
}

global.dashboard.registerWidget("SGAggregate", SG_AGGREGATE);

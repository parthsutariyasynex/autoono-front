import { combineReducers } from 'redux';
import authReducer from './authReducer';
import addressReducer from './addressReducer';
import customerReducer from './customerReducer';

const rootReducer = combineReducers({
    auth: authReducer,
    address: addressReducer,
    customer: customerReducer,
});

export default rootReducer;

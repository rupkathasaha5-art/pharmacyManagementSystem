import {app} from "./app.js"
import connectDB from "./db/index.js";
import { initCreditFreezeJob } from "./jobs/creditFreezeCron.js";

connectDB()
.then(
    async()=>{

      
        initCreditFreezeJob();
        app.listen(process.env.PORT || 8000,()=>{
            console.log(`Server is running at : ${process.env.PORT}`);
        })
        app.on("error",(error)=>{
            console.log("ERROR OCCURRED:",error);
            throw error;
        })

    }
)
.catch(
    (err)=>{
        console.log(`mongo db connection failed : ${err}`)
    }
)
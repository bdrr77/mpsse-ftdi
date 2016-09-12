var ftdiMpsse = require('../index');

var deviceA;
var deviceB;

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

ftdiMpsse.find(0x0403, 0x6010, function(err, devices) {
  if(devices.length == 0)
  {
  	console.log("No devices found");
  	process.exit(1);
  } else {

	deviceA = new ftdiMpsse.FtdiMpsse(devices[0]);
	//deviceB = new ftdiMpsse.FtdiMpsse(devices[1]);

	//deviceA.GPIO_Write('MPSSE_CMD_SET_DATA_BITS_LOWBYTE',0xF0,0xFF);
	//deviceA.GPIO_Write('MPSSE_CMD_SET_DATA_BITS_HIGHBYTE',0x0F,0xFF);
	deviceA.SPI_Init(12000000,0,0,0, function() {
		console.log("Init done");
		deviceA.SPI_CSEnable();
		deviceA.SPI_Transfer([0x55,0x00],2, function(error, rxData){
				console.log("fucking data is ");
				console.log(rxData);
		});
	});

	//deviceA.SPI_CSEnable();
	//deviceA.SPI_CSDisable();
	//deviceA.GPIO_Read();

	
	//setTimeout( transfer, 500);

	//deviceB.GPIO_Write('MPSSE_CMD_SET_DATA_BITS_LOWBYTE',0x0F,0xFF);
	//deviceB.GPIO_Write('MPSSE_CMD_SET_DATA_BITS_HIGHBYTE',0xF0,0xFF);
	//deviceB.SPI_Init();
	//deviceB.SPI_CSEnable();
	//deviceB.SPI_CSDisable();
	//deviceB.GPIO_Read();
	//if(deviceA !== undefined)
    //	deviceA.close();
  }
});

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");

    if(deviceA !== undefined)
    	deviceA.close();

    if(deviceB !== undefined)
    	deviceB.close();
    
    process.exit(1);
});

function transfer()
{ 
	deviceA.SPI_Transfer(); 
	setTimeout( transfer, 500);
}
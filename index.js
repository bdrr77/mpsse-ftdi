var ftdi = require('../ftdi-dev/index');
var defines = {

 'MIN_CLOCK_RATE'                             : 0,
 'MAX_CLOCK_RATE'                             :	60000000,

 'MIN_LATENCY_TIMER'                          : 0,
 'MAX_LATENCY_TIMER'       	                  :	255,
 'USB_INPUT_BUFFER_SIZE'		                  :	65536,
 'USB_OUTPUT_BUFFER_SIZE'		                  :	65536,
 'DISABLE_EVENT'					                    : 0,
 'DISABLE_CHAR'					                      : 0,
 'DEVICE_READ_TIMEOUT_INFINITE'               : 0,
 'DEVICE_WRITE_TIMEOUT' 			                : 5000,
 'INTERFACE_MASK_IN'				                  : 0x00,
 'INTERFACE_MASK_OUT'				                  : 0x01,
 'RESET_INTERFACE'					                  : 0,
 'ENABLE_MPSSE'					                      : 0X02,

/*MPSSE Control Commands*/
 'MPSSE_CMD_SET_DATA_BITS_LOWBYTE'            : 0x80,
 'MPSSE_CMD_SET_DATA_BITS_HIGHBYTE'           :	0x82,
 'MPSSE_CMD_GET_DATA_BITS_LOWBYTE'		        : 0x81,
 'MPSSE_CMD_GET_DATA_BITS_HIGHBYTE'	          : 0x83,

 'MPSSE_CMD_CONNECT_TDI_TDO_FOR_LOOPBACK'     : 0x84,
 'MPSSE_CMD_DISCONNECT_TDI_TDO_FOR_LOOPBACK'  : 0x85,

 'MPSSE_CMD_SET_TCK_SK_DIVISOR'               : 0x86,

 'MPSSE_CMD_SEND_IMMEDIATE'			              : 0x87,
 'MPSSE_CMD_DISABLE_CLOCK_DIVIDE_BY_5'        : 0x8A,
 'MPSSE_CMD_ENABLE_CLOCK_DIVIDE_BY_5'         : 0x8B,
 'MPSSE_CMD_ENABLE_3PHASE_CLOCKING'	          : 0x8C,
 'MPSSE_CMD_DISABLE_3PHASE_CLOCKING'	        : 0x8D,
 'MPSSE_CMD_ENABLE_ADAPTIVE_CLOCKING'         : 0x96,
 'MPSSE_CMD_DISABLE_ADAPTIVE_CLOCKING'        : 0x97,
 'MPSSE_CMD_ENABLE_DRIVE_ONLY_ZERO'	          : 0x9E,

/*MPSSE Data Commands - bit mode - MSB first */
 'MSB_RISING_EDGE_CLOCK_BIT_OUT'              : 0x12,
 'MSB_FALLING_EDGE_CLOCK_BIT_OUT'             : 0x13,
 'MSB_RISING_EDGE_CLOCK_BIT_IN'               : 0x22,
 'MSB_FALLING_EDGE_CLOCK_BIT_IN'              : 0x26,
 'MPSSE_CMD_DATA_BITS_IN_POS_OUT_NEG_EDGE'	  : 0x33,
 'MPSSE_CMD_DATA_BITS_IN_NEG_OUT_POS_EDGE'	  : 0x36,


/*MPSSE Data Commands - byte mode - MSB first */
 'MSB_RISING_EDGE_CLOCK_BYTE_OUT'	            : 0x10,
 'MSB_FALLING_EDGE_CLOCK_BYTE_OUT'  	        : 0x11,
 'MSB_RISING_EDGE_CLOCK_BYTE_IN'  	          : 0x20,
 'MSB_FALLING_EDGE_CLOCK_BYTE_IN'	            : 0x24,
 'MPSSE_CMD_DATA_BYTES_IN_POS_OUT_NEG_EDGE'	  : 0x31,
 'MPSSE_CMD_DATA_BYTES_IN_NEG_OUT_POS_EDGE'	  : 0x34,


/*SCL & SDA directions*/
 'DIRECTION_SCLIN_SDAIN'				              : 0x10,
 'DIRECTION_SCLOUT_SDAIN'				              : 0x11,
 'DIRECTION_SCLIN_SDAOUT'				              : 0x12,
 'DIRECTION_SCLOUT_SDAOUT'				            : 0x13,

/*SCL & SDA values*/
 'VALUE_SCLLOW_SDALOW'					              : 0x00,
 'VALUE_SCLHIGH_SDALOW'				                : 0x01,
 'VALUE_SCLLOW_SDAHIGH'				                : 0x02,
 'VALUE_SCLHIGH_SDAHIGH'				              : 0x03,

/*Data size in bits*/
 'DATA_SIZE_8BITS'						                : 0x07,
 'DATA_SIZE_1BIT'						                  : 0x00,

/* The I2C master should actually drive the SDA line only when the output is LOW. It should
tristate the SDA line when the output should be high. This tristating the SDA line during high
output is supported only in FT232H chip. This feature is called DriveOnlyZero feature and is
enabled when the following bit is set in the options parameter in function I2C_Init */
 'I2C_ENABLE_DRIVE_ONLY_ZERO'	                : 0x0002
};

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

var FtdiMpsse = function (device) {
        this.device = new ftdi.FtdiDevice(device);
        this.device.open({
          baudrate: 115200,
          databits: 8,
          stopbits: 1,
          parity: 'none',
          bitmode: 'mpsse',
          bitmask: 0xFB    
        });
        //console.log("Connected to " + this.device.deviceSettings.description + " in MPSSE mode");
        sleep(50);
};

//Added methods 
FtdiMpsse.prototype.SPI_Init = function(frequency, CPHA, CPOL, CS, callback)//TODO finish it cause its configured for I2C
{
  var self = this.device;
  var tckSkDivisor;
  //console.log("Ftdi mpsse SPI_Init ");

  //Clock divisor determination
  tckSkDivisor = (defines['MAX_CLOCK_RATE'] / (2 * frequency)) - 1;
  tckSkDivisor = (tckSkDivisor - tckSkDivisor %1);
  if(tckSkDivisor > 0xFFFF){
    tckSkDivisor = 0xFFFF;
  }
    
  //Clocking configuration
  self.write( [
                defines['MPSSE_CMD_DISABLE_CLOCK_DIVIDE_BY_5'],//Master clock set to 60 MHz
                defines['MPSSE_CMD_DISABLE_ADAPTIVE_CLOCKING'],
                defines['MPSSE_CMD_DISABLE_3PHASE_CLOCKING']
              ], 
  function(err) {
    self.on('error', function(err) {
      console.log("SPI_Init : Error configuring clock : " + err);
    });
    /*self.on('data', function(data) {
      console.log("Data received on init :");
        console.log(data);
    });*/
  });

  //sleep(1000);

  //TCK/TDI/TDO IO configuration
  this.GPIO_Write('MPSSE_CMD_SET_DATA_BITS_LOWBYTE',0x08,0x0B);

  //SK Clock frequency configuration
  self.write( [
                defines['MPSSE_CMD_SET_TCK_SK_DIVISOR'],
                (tckSkDivisor & 0xFF),
                (tckSkDivisor >> 8)
              ], 
  function(err) {
    self.on('error', function(err) {
      console.log("SPI_Init : Error configuring TCK SK clock : " + err);
    });
    /*self.on('data', function(data) {
      console.log("Data received on init :");
        console.log(data);
    });*/
  });

  sleep(20);

  //Turn off loopback
  self.write( [
                defines['MPSSE_CMD_DISCONNECT_TDI_TDO_FOR_LOOPBACK']//Set to disconnect after tests
              ], 
  function(err) {
    self.on('error', function(err) {
      console.log("SPI_Init : Error turning off loopback : " + err);
    });
    /*self.on('data', function(data) {
        console.log("Data received on init :");
        console.log(data);
    });*/
  });

  sleep(30);

  if (callback) { callback(); }

};

FtdiMpsse.prototype.SPI_CSEnable = function()
{
  var self = this.device;
  //console.log("Ftdi mpsse SPI_CSEnable ");
  this.GPIO_Write('MPSSE_CMD_SET_DATA_BITS_LOWBYTE',0x00,0x0B);
};

FtdiMpsse.prototype.SPI_CSDisable = function()
{
  var self = this.device;
  //console.log("Ftdi mpsse SPI_CSDisable");
  this.GPIO_Write('MPSSE_CMD_SET_DATA_BITS_LOWBYTE',0x08,0x0B);
};

FtdiMpsse.prototype.GPIO_Read = function()
{
  var self = this.device;
  //console.log("Reading " + self.deviceSettings.description);
  self.write( [
                defines['MPSSE_CMD_GET_DATA_BITS_LOWBYTE'],
                defines['MPSSE_CMD_GET_DATA_BITS_HIGHBYTE']
              ], 
    function(err) {
      self.on('error', function(err) {
        console.log("Error reading GPIO status : " + err);
        });
      self.on('data', function(data) {
        console.log(self.deviceSettings.description + " GPIO Low Byte : " + data[0].toString(16));
        console.log(self.deviceSettings.description + " GPIO High Byte : " + data[1].toString(16));
      });
  });
};

FtdiMpsse.prototype.SPI_Transfer = function(txBuffer,txSize,rxCallback)
{
  //Sending Data
  var mpsseDev = this;
  var self = this.device;
  
  var finalTxSize = txSize - 1;
  var bufferHeader;

  if(txBuffer == null){
    txBuffer = new Array(txSize).fill(0x00);
  }

  if ((txSize <= 65536) || (txSize == 0))  {
    
    //this.SPI_CSEnable();
    //console.log("Sending data over " + self.deviceSettings.description);
    bufferHeader = [
                    defines['MPSSE_CMD_DATA_BYTES_IN_POS_OUT_NEG_EDGE'],
                    (finalTxSize & 0x00FF),//0x01,//Length LOW
                    ((finalTxSize & 0xFF00) >> 8),//Length HIGH
                  ];
    bufferHeader = bufferHeader.concat(txBuffer);

    self.write( bufferHeader, 
      function(err) {
        self.on('error', function(err) {
          console.log("Error sending data : " + err);
          });
        self.on('data', function(data) {
          if (rxCallback) { rxCallback(false, data); }
        });
        //mpsseDev.SPI_CSDisable();
    });

  } else {
    console.log("SPI_Transfer invalid parameters");
    if (rxCallback) { rxCallback(true, null); }
  }
};


FtdiMpsse.prototype.GPIO_Write = function(busCommand,state,mask)
{
  var self = this.device;
  //console.log("Writing to " + self.deviceSettings.description);

  if( (busCommand != 'MPSSE_CMD_SET_DATA_BITS_LOWBYTE')  &&  (busCommand != 'MPSSE_CMD_SET_DATA_BITS_HIGHBYTE') )
  {
    console.log("Wrong bus command passed");
  } else {
    self.write([defines[busCommand],state,mask], function(err) {
      self.on('error', function(err) {
        console.log("Error writing to GPIO status : " + err);
      });
      /*self.on('data', function(data) {
        console.log("Data received on GPIO Write :");
        console.log(data);
      });*/
    });
  }
};


FtdiMpsse.prototype.close = function()
{
  var self = this.device;
  console.log("Closing " + self.deviceSettings.description);
  self.close();
};
//Module Exports 

module.exports = {

  FtdiMpsse: FtdiMpsse,

  find: function(vid, pid, callback) {
    ftdi.find(vid, pid, callback)
  }

};
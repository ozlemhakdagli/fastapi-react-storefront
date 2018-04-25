
    <!-- Main content -->
    <section class="content">
      <!-- Info boxes -->
      <div class="row">
        <div class="col-md-3 col-sm-6 col-xs-12">
          <div class="info-box">
            <span class="info-box-icon bg-red"><i class="fa fa-envelope"></i></span>

            <div class="info-box-content">
              <span class="info-box-text">Yeni Mesajlar</span>
              <span class="info-box-number"><?php $i=0; foreach($mesajlar as $rs){ ++$i; } echo $i;?></span>
            </div>
            <!-- /.info-box-content -->
          </div>
          <!-- /.info-box -->
        </div>
        <!-- /.col -->
        <div class="col-md-3 col-sm-6 col-xs-12">
          <div class="info-box">
            <span class="info-box-icon bg-red"><i class="ion ion-ios-people-outline"></i></span>

            <div class="info-box-content">
              <span class="info-box-text">Üye Sayısı</span>
              <span class="info-box-number"><?php $i=0; foreach($musteriler as $rs){ ++$i; } echo $i;?></span>
            </div>
            <!-- /.info-box-content -->
          </div>
          <!-- /.info-box -->
        </div>
        <!-- /.col -->

        <!-- fix for small devices only -->
        <div class="clearfix visible-sm-block"></div>

        <div class="col-md-3 col-sm-6 col-xs-12">
          <div class="info-box">
            <span class="info-box-icon bg-green"><i class="ion ion-ios-cart-outline"></i></span>

            <div class="info-box-content">
              <span class="info-box-text">Yeni Sipariş</span>
              <span class="info-box-number"><?php $i=0; foreach($veriler as $rs){ ++$i; } echo $i;?></span>
            </div>
            <!-- /.info-box-content -->
          </div>
          <!-- /.info-box -->
        </div>
        <!-- /.col -->
        <div class="col-md-3 col-sm-6 col-xs-12">
          <div class="info-box">
            <span class="info-box-icon bg-yellow"><i class="ion ion-ios-cart-outline"></i></span>

            <div class="info-box-content">
              <span class="info-box-text">Tamamlanan Sipariş</span>
              <span class="info-box-number"><?php $i=0; foreach($veri as $rs){ ++$i; } echo $i;?></span>
            </div>
            <!-- /.info-box-content -->
          </div>
          <!-- /.info-box -->
        </div>
        <!-- /.col -->
      </div>
      <!-- /.row -->

      <div class="row">
        <div class="col-md-8">
          <div class="box">
            <div class="box-header with-border">
              <h3 class="box-title">Son Siparişler Listesi</h3>

              <div class="box-tools pull-right">
                <button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-minus"></i>
                </button>
             
                <button type="button" class="btn btn-box-tool" data-widget="remove"><i class="fa fa-times"></i></button>
              </div>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
              <div class="row">
                <div class="col-md-8">
                   <div class="box-body">
              <div class="table-responsive">
                <table class="table no-margin">
                  <thead>
                       <th>Sipariş Numarası</th>
                        <th>Müşteri Adi</th>
                        <th>Tutar</th>
                       <?php foreach($veriler as $rs){ ?>
                  <tr>
                   
                    <td><?=$rs->Id?></td>
                    
                    <td><?=$rs->adsoy?></td>
                    
                    <td><?=$rs->tutar?></td>
                  
                   
                    
                  </tr>
                  <?php  } ?>
                  </thead>
                  
                </table>
              </div>
			  
              <!-- /.table-responsive -->
            </div>

                  
                  <!-- /.chart-responsive -->
                </div>
                <!-- /.col -->
                
                <!-- /.col -->
              </div>
              <!-- /.row -->
            </div>
            <!-- ./box-body -->
            <div class="box-footer">
           
              <!-- /.row -->
            </div>
            <!-- /.box-footer -->
          </div>
          <!-- /.box -->
        </div>
		 <div class="col-md-4">
       
         <!-- PRODUCT LIST -->
          <div class="box box-primary">
            <div class="box-header with-border">
              <h3 class="box-title">En Son Eklenen Ürünler</h3>

              <div class="box-tools pull-right">
                <button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-minus"></i>
                </button>
                <button type="button" class="btn btn-box-tool" data-widget="remove"><i class="fa fa-times"></i></button>
              </div>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
              <ul class="products-list product-list-in-box">
                   <table class="table no-margin">
                  <thead>
                       <th>Ürün Numarası</th>
                        <th>Ürün Adı</th>
                        <th>Adet</th>
                       <?php foreach($urunler as $rs){ ?>
                  <tr>
                   
                    <td><?=$rs->Id?></td>
                    
                    <td><?=$rs->adi?></td>
                    
                    <td><?=$rs->stok?></td>
                  
                   
                    
                  </tr>
                  <?php  } ?>
                  </thead>
                  
                </table>
                
              </ul>
            </div>
            <!-- /.box-body -->
            <div class="box-footer text-center">
              <a<a href="javascript:void(0)" class="btn btn-sm btn-default btn-flat pull-right">Tümünü Göster</a>
            </div>
            <!-- /.box-footer -->
          </div>
          <!-- /.box -->
        </div>
        <div class="col-md-4">
              <!-- USERS LIST -->
              <div class="box box-danger">
                <div class="box-header with-border">
                  <h3 class="box-title">Yeni Üyeler</h3>
				  <div class="box-tools pull-right">
                <button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-minus"></i>
                </button>
                <button type="button" class="btn btn-box-tool" data-widget="remove"><i class="fa fa-times"></i></button>
              </div>
				  

                  
				  
                </div>
                <!-- /.box-header -->
                <div class="box-body no-padding">
                   <table class="table no-margin">
                  <thead>
                       <th>Müşteri Numarası</th>
                        <th>Müşteri Adi</th>
                       
                       <?php foreach($musteriler as $rs){ ?>
                  <tr>
                   
                    <td><?=$rs->Id?></td>
                    
                    <td><?=$rs->AdiSoyadi?></td>
                    
                    
                  
                   
                    
                  </tr>
                  <?php  } ?>
                  </thead>
                  
                </table>
                  <!-- /.users-list -->
                </div>
                <!-- /.box-body -->
                <div class="box-footer text-center">
                  <a href="javascript:void(0)" class="btn btn-sm btn-default btn-flat pull-right">Tümünü Göster</a>
                </div>
                <!-- /.box-footer -->
              </div>
              <!--/.box -->
            </div>
        <!-- /.col -->
      </div>
      <!-- /.row -->
	  

      <!-- Main row -->
      <div class="row">
        <!-- Left col -->
        <div class="col-md-8">
          <!-- MAP & BOX PANE -->
          
          <!-- /.box -->
          
          <!-- /.row -->

          <!-- TABLE: LATEST ORDERS -->
         
	
		

       
        <!-- /.col -->
      </div>
      <!-- /.row -->
    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
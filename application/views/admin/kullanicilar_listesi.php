
        <div class="col-xs-12">
          <div class="box">
            <div class="box-header">
			<h2 align="center" font-weight=" bold">Kullanıcılar Tablosu</h2><br>
			  <?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-check"></i> <?=$this->session->flashdata('sonuc')?>
                
              </div>
			  <?php } ?>
              
            </div>
            <!-- /.box-header -->
            <div class="box-body table-responsive no-padding">
              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  
                  <th bgcolor="#99ccff">Adı Soyadı</th>
                  <th bgcolor="#99ccff">Mail Adresi</th>
				  <th bgcolor="#99ccff">Yetki</th>
				  <th bgcolor="#99ccff">Durum</th>
				  
				  <th bgcolor="#99ccff">İşlemler</th>
                </tr>
				</thead>
				<tbody>
                <?php
				foreach($veri as $rs)
				{
                ?>
				
				
				<tr>
                  
                  <td><?=$rs->adiSoyadi?></td>
                  <td><?=$rs->email?></td>
				  <td><?=$rs->yetki?></td>
				  <td><span class="label label-success"><?=$rs->durum?></span></td>
				 
				 
				 <td>
                    <div class="btn-group">
					<a href ="<?=base_url() ?>admin/Kullanicilar/edit/<?=$rs->ID ?>"><button type="button" class="btn btn-default"  >Düzenle</button></a>
                    <a href ="<?=base_url() ?>admin/kullanicilar/preview/<?=$rs->ID ?>"> <button type="button" class="btn btn-info" data-toggle="modal" data-target="#modal-default"> Görüntüle    </button></a>
           
                    <a href ="<?=base_url() ?>admin/kullanicilar/delete/<?=$rs->ID ?>" onclick="return confirm('Silmek istediğinize emin misiniz?')" ><button type="button" class="btn btn-danger">Sil</button></a>
                    </div>
                  </td>
				  
                </tr>
				
				
				
				
				
				 <?php
				}
                ?>
				</tbody>
                
                
              </table>
            </div>
            <!-- /.box-body -->
          </div>
          <!-- /.box -->
        </div>

    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  
